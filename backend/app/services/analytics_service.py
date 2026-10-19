"""
Analytics Service — Security & Performance Analytics for SecureCipher.

All queries are strictly user-scoped. There is no administrator role in this
application, so system-wide aggregates across users are not supported.

Data source: PostgreSQL operation_history table.
Fields used: id, algorithm_name, operation_type, status,
             execution_duration_ms, user_id, created_at.

Query design:
  - All aggregation is performed in PostgreSQL, not in Python.
  - Only required columns are fetched.
  - Date filters and user_id are applied as SQL predicates.
  - Duration calculations exclude records with execution_duration_ms <= 0.
  - Percentile calculations require minimum sample sizes to be meaningful.

SECURITY:
  - No plaintext, keys, passphrases, signatures, or file contents are
    stored in operation_history or returned by any analytics endpoint.
  - Per-user scoping is enforced in every query.
"""
import logging
import math
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple

from sqlalchemy import (
    select, func, case, and_, text
)
from sqlalchemy.orm import Session

from app.models.history import OperationHistory
from app.schemas.analytics import (
    AnalyticsSummary,
    TimeSeriesBucket,
    OperationsOverTimeResponse,
    AlgorithmCount,
    OperationTypeCount,
    DistributionResponse,
    PerformanceEntry,
    PerformanceResponse,
    SecurityEvent,
    SecurityEventsResponse,
)

logger = logging.getLogger(__name__)

# ─── Constants ────────────────────────────────────────────────────────────────

# Maximum date range to prevent runaway queries
MAX_RANGE_DAYS = 365

# Minimum valid duration to include in performance calculations
MIN_VALID_DURATION_MS = 0.0

# Anomaly thresholds (configurable; these are the defaults)
THRESHOLDS = {
    "sig_verify_failures_1h": 5,     # failed signature verifications in 1 hour
    "failed_operations_1h": 10,      # any failed crypto operations in 1 hour
    "error_spike_1h": 20,            # total failures in 1 hour (absolute)
    "failed_ops_ratio_pct": 50,      # % of operations that failed in 1 hour
}

# Percentile minimum sample requirements
P50_MIN = 5
P95_MIN = 20
P99_MIN = 100


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _clamp_date_range(
    start: Optional[datetime],
    end: Optional[datetime],
) -> Tuple[datetime, datetime]:
    """
    Return a (start, end) pair in UTC.
    Defaults to last 7 days when not specified.
    Clamps to MAX_RANGE_DAYS.
    """
    now = datetime.now(timezone.utc)
    if end is None:
        end = now
    else:
        end = end if end.tzinfo else end.replace(tzinfo=timezone.utc)

    if start is None:
        start = end - timedelta(days=7)
    else:
        start = start if start.tzinfo else start.replace(tzinfo=timezone.utc)

    if start > end:
        start, end = end, start

    max_start = end - timedelta(days=MAX_RANGE_DAYS)
    if start < max_start:
        start = max_start

    return start, end


def _trunc_expr(db: Session, granularity: str):
    """
    Return a date truncation SQL expression compatible with both PostgreSQL and SQLite.
    PostgreSQL: date_trunc('hour'|'day', created_at)
    SQLite: strftime('%Y-%m-%d %H:00:00', created_at) or strftime('%Y-%m-%d 00:00:00', created_at)
    """
    try:
        dialect_name = db.get_bind().dialect.name
    except Exception:
        dialect_name = ""
    if "sqlite" in dialect_name:
        fmt = "%Y-%m-%d %H:00:00" if granularity == "hour" else "%Y-%m-%d 00:00:00"
        return func.strftime(fmt, OperationHistory.created_at)
    return func.date_trunc(granularity, OperationHistory.created_at)


def _base_filters(
    user_id: int,
    start: datetime,
    end: datetime,
    algorithm: Optional[str] = None,
    operation_type: Optional[str] = None,
    status_filter: Optional[str] = None,
) -> list:
    """Build the common SQLAlchemy filter list for all queries."""
    filters = [
        OperationHistory.user_id == user_id,
        OperationHistory.created_at >= start,
        OperationHistory.created_at <= end,
    ]
    if algorithm and algorithm.strip().upper() not in ("ALL", ""):
        filters.append(OperationHistory.algorithm_name.ilike(f"%{algorithm.strip()}%"))
    if operation_type and operation_type.strip().upper() not in ("ALL", ""):
        filters.append(OperationHistory.operation_type.ilike(f"%{operation_type.strip()}%"))
    if status_filter and status_filter.strip().lower() not in ("all", ""):
        filters.append(OperationHistory.status == status_filter.strip().lower())
    return filters


def _percentile(sorted_values: List[float], p: float) -> float:
    """
    Nearest-rank percentile of a pre-sorted list.
    p is in [0, 100].
    """
    n = len(sorted_values)
    if n == 0:
        raise ValueError("Empty list")
    idx = max(0, math.ceil(p / 100.0 * n) - 1)
    return sorted_values[min(idx, n - 1)]


# ─── Summary ─────────────────────────────────────────────────────────────────

def get_analytics_summary(
    db: Optional[Session],
    user_id: int,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    algorithm: Optional[str] = None,
    operation_type: Optional[str] = None,
    status_filter: Optional[str] = None,
) -> AnalyticsSummary:
    """
    Compute summary statistics from the audit table for the authenticated user.
    All aggregation runs in PostgreSQL.
    """
    start, end = _clamp_date_range(start, end)

    if db is None:
        return AnalyticsSummary(
            total_operations=0, successful_operations=0, failed_operations=0,
            success_rate=None, signature_verification_failures=0,
            avg_duration_ms=None, min_duration_ms=None, max_duration_ms=None,
            duration_sample_count=0,
            date_range_start=start, date_range_end=end,
            filters_applied={},
            database_connected=False,
            note="Database not available.",
        )

    try:
        filters = _base_filters(user_id, start, end, algorithm, operation_type, status_filter)

        # Single aggregate query for counts and durations
        stmt = select(
            func.count().label("total"),
            func.sum(
                case((OperationHistory.status == "success", 1), else_=0)
            ).label("successful"),
            func.sum(
                case((OperationHistory.status == "failure", 1), else_=0)
            ).label("failed"),
            # Signature verification failures: pss verify ops that failed
            func.sum(
                case(
                    (
                        and_(
                            OperationHistory.operation_type.in_(
                                ["signature_verification", "file_signature_verification"]
                            ),
                            OperationHistory.status == "failure",
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("sig_verify_failures"),
            func.avg(
                case(
                    (OperationHistory.execution_duration_ms > MIN_VALID_DURATION_MS,
                     OperationHistory.execution_duration_ms),
                    else_=None,
                )
            ).label("avg_dur"),
            func.min(
                case(
                    (OperationHistory.execution_duration_ms > MIN_VALID_DURATION_MS,
                     OperationHistory.execution_duration_ms),
                    else_=None,
                )
            ).label("min_dur"),
            func.max(
                case(
                    (OperationHistory.execution_duration_ms > MIN_VALID_DURATION_MS,
                     OperationHistory.execution_duration_ms),
                    else_=None,
                )
            ).label("max_dur"),
            func.count(
                case(
                    (OperationHistory.execution_duration_ms > MIN_VALID_DURATION_MS,
                     OperationHistory.id),
                    else_=None,
                )
            ).label("dur_count"),
        ).where(*filters)

        row = db.execute(stmt).one()

        total = row.total or 0
        successful = row.successful or 0
        failed = row.failed or 0
        sig_fail = row.sig_verify_failures or 0
        avg_dur = float(row.avg_dur) if row.avg_dur is not None else None
        min_dur = float(row.min_dur) if row.min_dur is not None else None
        max_dur = float(row.max_dur) if row.max_dur is not None else None
        dur_count = row.dur_count or 0
        success_rate = (successful / total * 100.0) if total > 0 else None

        return AnalyticsSummary(
            total_operations=total,
            successful_operations=successful,
            failed_operations=failed,
            success_rate=round(success_rate, 2) if success_rate is not None else None,
            signature_verification_failures=sig_fail,
            avg_duration_ms=round(avg_dur, 2) if avg_dur is not None else None,
            min_duration_ms=round(min_dur, 2) if min_dur is not None else None,
            max_duration_ms=round(max_dur, 2) if max_dur is not None else None,
            duration_sample_count=dur_count,
            date_range_start=start,
            date_range_end=end,
            filters_applied={
                "algorithm": algorithm,
                "operation_type": operation_type,
                "status": status_filter,
            },
            database_connected=True,
        )

    except Exception as e:
        logger.warning("Analytics summary query failed: %s", str(e))
        return AnalyticsSummary(
            total_operations=0, successful_operations=0, failed_operations=0,
            success_rate=None, signature_verification_failures=0,
            avg_duration_ms=None, min_duration_ms=None, max_duration_ms=None,
            duration_sample_count=0,
            date_range_start=start, date_range_end=end,
            filters_applied={},
            database_connected=False,
            note="Analytics query could not be completed.",
        )


# ─── Operations Over Time ────────────────────────────────────────────────────

def get_operations_over_time(
    db: Optional[Session],
    user_id: int,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    algorithm: Optional[str] = None,
    operation_type: Optional[str] = None,
) -> OperationsOverTimeResponse:
    """
    Return time-series buckets (hour or day) of operation counts.
    Uses date_trunc('hour'|'day', created_at) in PostgreSQL.
    """
    start, end = _clamp_date_range(start, end)
    delta = end - start
    granularity = "hour" if delta.total_seconds() <= 86400 * 3 else "day"

    empty = OperationsOverTimeResponse(
        buckets=[], granularity=granularity,
        date_range_start=start, date_range_end=end,
        database_connected=db is not None,
    )
    if db is None:
        return empty

    try:
        filters = _base_filters(user_id, start, end, algorithm, operation_type)

        trunc_col = _trunc_expr(db, granularity)
        stmt = (
            select(
                trunc_col.label("bucket"),
                func.count().label("total"),
                func.sum(
                    case((OperationHistory.status == "success", 1), else_=0)
                ).label("successful"),
                func.sum(
                    case((OperationHistory.status == "failure", 1), else_=0)
                ).label("failed"),
            )
            .where(*filters)
            .group_by(trunc_col)
            .order_by(trunc_col)
        )

        rows = db.execute(stmt).all()
        buckets = [
            TimeSeriesBucket(
                bucket=r.bucket.isoformat() if hasattr(r.bucket, "isoformat") else str(r.bucket),
                total=r.total or 0,
                successful=r.successful or 0,
                failed=r.failed or 0,
            )
            for r in rows
        ]
        return OperationsOverTimeResponse(
            buckets=buckets, granularity=granularity,
            date_range_start=start, date_range_end=end,
            database_connected=True,
        )
    except Exception as e:
        logger.warning("operations_over_time query failed: %s", str(e))
        return empty


# ─── Distribution ────────────────────────────────────────────────────────────

def get_distribution(
    db: Optional[Session],
    user_id: int,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
) -> DistributionResponse:
    """
    Return counts by algorithm and operation type for the selected period.
    """
    start, end = _clamp_date_range(start, end)
    empty = DistributionResponse(
        by_algorithm=[], by_operation_type=[],
        date_range_start=start, date_range_end=end,
        database_connected=db is not None,
    )
    if db is None:
        return empty

    try:
        base = [
            OperationHistory.user_id == user_id,
            OperationHistory.created_at >= start,
            OperationHistory.created_at <= end,
        ]
        success_col = func.sum(case((OperationHistory.status == "success", 1), else_=0))
        failed_col = func.sum(case((OperationHistory.status == "failure", 1), else_=0))

        # By algorithm
        algo_stmt = (
            select(
                OperationHistory.algorithm_name.label("algo"),
                func.count().label("total"),
                success_col.label("successful"),
                failed_col.label("failed"),
            )
            .where(*base)
            .group_by(OperationHistory.algorithm_name)
            .order_by(func.count().desc())
        )
        algo_rows = db.execute(algo_stmt).all()
        by_algo = [
            AlgorithmCount(
                algorithm=r.algo,
                total=r.total or 0,
                successful=r.successful or 0,
                failed=r.failed or 0,
            )
            for r in algo_rows if r.total
        ]

        # By operation type
        op_stmt = (
            select(
                OperationHistory.operation_type.label("op_type"),
                func.count().label("total"),
                success_col.label("successful"),
                failed_col.label("failed"),
            )
            .where(*base)
            .group_by(OperationHistory.operation_type)
            .order_by(func.count().desc())
        )
        op_rows = db.execute(op_stmt).all()
        by_op = [
            OperationTypeCount(
                operation_type=r.op_type,
                total=r.total or 0,
                successful=r.successful or 0,
                failed=r.failed or 0,
            )
            for r in op_rows if r.total
        ]

        return DistributionResponse(
            by_algorithm=by_algo, by_operation_type=by_op,
            date_range_start=start, date_range_end=end,
            database_connected=True,
        )
    except Exception as e:
        logger.warning("distribution query failed: %s", str(e))
        return empty


# ─── Performance ─────────────────────────────────────────────────────────────

def get_performance(
    db: Optional[Session],
    user_id: int,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
) -> PerformanceResponse:
    """
    Return performance metrics by algorithm and operation type.
    Percentiles are calculated in Python from a bounded column-only fetch.
    P50 requires ≥ 5 samples, P95 ≥ 20, P99 ≥ 100.
    """
    start, end = _clamp_date_range(start, end)
    empty = PerformanceResponse(
        by_algorithm=[], by_operation_type=[],
        overall_avg_ms=None, overall_sample_count=0,
        date_range_start=start, date_range_end=end,
        database_connected=db is not None,
    )
    if db is None:
        return empty

    try:
        base = [
            OperationHistory.user_id == user_id,
            OperationHistory.created_at >= start,
            OperationHistory.created_at <= end,
            OperationHistory.execution_duration_ms > MIN_VALID_DURATION_MS,
        ]

        # Fetch only (algorithm_name, operation_type, execution_duration_ms)
        stmt = select(
            OperationHistory.algorithm_name,
            OperationHistory.operation_type,
            OperationHistory.execution_duration_ms,
        ).where(*base).limit(10000)

        rows = db.execute(stmt).all()
        if not rows:
            return empty

        # Group into dicts for percentile calculation
        algo_map: Dict[str, List[float]] = {}
        op_map: Dict[str, List[float]] = {}
        all_durs: List[float] = []

        for r in rows:
            dur = float(r.execution_duration_ms)
            all_durs.append(dur)
            algo_map.setdefault(r.algorithm_name, []).append(dur)
            op_map.setdefault(r.operation_type, []).append(dur)

        def make_entry(label: str, values: List[float]) -> PerformanceEntry:
            sorted_v = sorted(values)
            n = len(sorted_v)
            return PerformanceEntry(
                group_label=label,
                count=n,
                avg_ms=round(sum(sorted_v) / n, 2),
                min_ms=round(sorted_v[0], 2),
                max_ms=round(sorted_v[-1], 2),
                p50_ms=round(_percentile(sorted_v, 50), 2) if n >= P50_MIN else None,
                p95_ms=round(_percentile(sorted_v, 95), 2) if n >= P95_MIN else None,
                p99_ms=round(_percentile(sorted_v, 99), 2) if n >= P99_MIN else None,
            )

        by_algo = [
            make_entry(algo, durs)
            for algo, durs in sorted(algo_map.items(), key=lambda x: -len(x[1]))
        ]
        by_op = [
            make_entry(op, durs)
            for op, durs in sorted(op_map.items(), key=lambda x: -len(x[1]))
        ]
        overall_avg = round(sum(all_durs) / len(all_durs), 2) if all_durs else None

        return PerformanceResponse(
            by_algorithm=by_algo,
            by_operation_type=by_op,
            overall_avg_ms=overall_avg,
            overall_sample_count=len(all_durs),
            date_range_start=start,
            date_range_end=end,
            database_connected=True,
        )

    except Exception as e:
        logger.warning("performance query failed: %s", str(e))
        return empty


# ─── Security Events ─────────────────────────────────────────────────────────

def get_security_events(
    db: Optional[Session],
    user_id: int,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 20,
) -> SecurityEventsResponse:
    """
    Rule-based security indicators derived from audit metadata.
    Rules operate on 1-hour sub-windows within the selected period.

    Rules implemented:
      1. sig_verify_failures_1h — ≥5 signature verification failures in any 1-hour window.
      2. failed_operations_1h  — ≥10 any-type crypto failures in any 1-hour window.
      3. error_spike_1h        — ≥20 total failures in any 1-hour window.
      4. failed_ops_ratio      — ≥50% of operations in an hour are failures (min 5 total ops).

    LIMITATION: Authentication failures, OTP lockouts, and authorization failures
    are NOT recorded in operation_history. These event categories are currently
    not available for analytics.
    """
    start, end = _clamp_date_range(start, end)
    empty = SecurityEventsResponse(
        events=[], anomaly_thresholds=THRESHOLDS,
        analysis_window_start=start, analysis_window_end=end,
        total_events=0,
        database_connected=db is not None,
    )
    if db is None:
        return empty

    try:
        base = [
            OperationHistory.user_id == user_id,
            OperationHistory.created_at >= start,
            OperationHistory.created_at <= end,
        ]

        # Aggregate per 1-hour buckets
        trunc_col = _trunc_expr(db, "hour")
        stmt = select(
            trunc_col.label("bucket"),
            func.count().label("total"),
            func.sum(case((OperationHistory.status == "failure", 1), else_=0)).label("failed"),
            func.sum(
                case(
                    (
                        and_(
                            OperationHistory.operation_type.in_(
                                ["signature_verification", "file_signature_verification"]
                            ),
                            OperationHistory.status == "failure",
                        ),
                        1,
                    ),
                    else_=0,
                )
            ).label("sig_fail"),
        ).where(*base).group_by(trunc_col).order_by(trunc_col)

        rows = db.execute(stmt).all()

        events: List[SecurityEvent] = []
        seen_ids = set()

        for r in rows:
            bucket_dt = r.bucket
            if isinstance(bucket_dt, str):
                try:
                    bucket_dt = datetime.fromisoformat(bucket_dt)
                except Exception:
                    bucket_dt = None
            # Ensure timezone-aware
            if bucket_dt and bucket_dt.tzinfo is None:
                bucket_dt = bucket_dt.replace(tzinfo=timezone.utc)
            bucket_end = bucket_dt + timedelta(hours=1) if bucket_dt else None
            total = r.total or 0
            failed = r.failed or 0
            sig_fail = r.sig_fail or 0
            ts_str = bucket_dt.strftime("%Y-%m-%dT%H:00Z") if bucket_dt else "unknown"

            # Rule 1: signature verification failures
            if sig_fail >= THRESHOLDS["sig_verify_failures_1h"]:
                eid = f"sig_fail_{ts_str}"
                if eid not in seen_ids:
                    seen_ids.add(eid)
                    events.append(SecurityEvent(
                        event_id=eid,
                        category="Signature Verification Failures",
                        severity="warning",
                        title="Elevated Signature Verification Failures",
                        description=(
                            f"{sig_fail} RSA-PSS signature verification failure(s) recorded "
                            f"in the hour starting {ts_str}. This may indicate tampered data, "
                            f"incorrect public keys, or repeated verification attempts with mismatched inputs."
                        ),
                        count=sig_fail,
                        window_start=bucket_dt,
                        window_end=bucket_end,
                        rule=f"signature_verification failures ≥ {THRESHOLDS['sig_verify_failures_1h']} in 1 hour",
                    ))

            # Rule 2: high general failure rate
            if failed >= THRESHOLDS["failed_operations_1h"]:
                eid = f"fail_ops_{ts_str}"
                if eid not in seen_ids:
                    seen_ids.add(eid)
                    events.append(SecurityEvent(
                        event_id=eid,
                        category="Cryptographic Operation Failures",
                        severity="warning",
                        title="High Cryptographic Failure Count",
                        description=(
                            f"{failed} failed cryptographic operation(s) in the hour starting {ts_str}. "
                            f"Failures can result from malformed inputs, incorrect keys, invalid Base64, "
                            f"or file size limit violations. Investigate if unexpected."
                        ),
                        count=failed,
                        window_start=bucket_dt,
                        window_end=bucket_end,
                        rule=f"failed operations ≥ {THRESHOLDS['failed_operations_1h']} in 1 hour",
                    ))

            # Rule 3: absolute error spike
            if failed >= THRESHOLDS["error_spike_1h"] and total > 0:
                eid = f"spike_{ts_str}"
                if eid not in seen_ids:
                    seen_ids.add(eid)
                    events.append(SecurityEvent(
                        event_id=eid,
                        category="Error Spike",
                        severity="alert",
                        title="Cryptographic Error Spike Detected",
                        description=(
                            f"{failed} of {total} operations failed in the hour starting {ts_str} "
                            f"({failed/total*100:.0f}%). This spike may indicate systematic misconfiguration, "
                            f"repeated invalid inputs, or an automated process sending malformed requests."
                        ),
                        count=failed,
                        window_start=bucket_dt,
                        window_end=bucket_end,
                        rule=f"failed operations ≥ {THRESHOLDS['error_spike_1h']} (absolute) in 1 hour",
                    ))

            # Rule 4: failure ratio
            if total >= 5 and (failed / total) * 100 >= THRESHOLDS["failed_ops_ratio_pct"]:
                eid = f"ratio_{ts_str}"
                if eid not in seen_ids:
                    seen_ids.add(eid)
                    ratio = int(failed / total * 100)
                    events.append(SecurityEvent(
                        event_id=eid,
                        category="High Failure Ratio",
                        severity="warning",
                        title=f"High Failure Rate ({ratio}%)",
                        description=(
                            f"{failed} of {total} operations failed ({ratio}%) in the hour starting {ts_str}. "
                            f"A consistently high failure ratio may indicate repeated attempts with "
                            f"incorrect keys, passphrases, or malformed inputs."
                        ),
                        count=failed,
                        window_start=bucket_dt,
                        window_end=bucket_end,
                        rule=f"failure rate ≥ {THRESHOLDS['failed_ops_ratio_pct']}% with ≥ 5 total ops in 1 hour",
                    ))

        # Sort by severity (alert > warning > info), then by time desc
        severity_order = {"alert": 0, "warning": 1, "info": 2}
        events.sort(key=lambda e: (
            severity_order.get(e.severity, 3),
            -(e.window_start.timestamp() if e.window_start else 0),
        ))

        # Paginate
        page = max(1, page)
        page_size = min(max(1, page_size), 100)
        offset = (page - 1) * page_size
        paginated = events[offset: offset + page_size]

        return SecurityEventsResponse(
            events=paginated,
            anomaly_thresholds=THRESHOLDS,
            analysis_window_start=start,
            analysis_window_end=end,
            total_events=len(events),
            database_connected=True,
        )

    except Exception as e:
        logger.warning("security_events query failed: %s", str(e))
        return empty


# ─── Export ──────────────────────────────────────────────────────────────────

def export_audit_records(
    db: Optional[Session],
    user_id: int,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    algorithm: Optional[str] = None,
    operation_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 5000,
) -> List[Dict]:
    """
    Fetch filtered audit metadata records for export (CSV or JSON).
    Strictly user-scoped. Contains only non-sensitive audit fields:
    id, algorithm_name, operation_type, status, execution_duration_ms, created_at.
    """
    start, end = _clamp_date_range(start, end)
    if db is None:
        return []
    try:
        filters = _base_filters(user_id, start, end, algorithm, operation_type, status_filter)
        stmt = (
            select(
                OperationHistory.id,
                OperationHistory.algorithm_name,
                OperationHistory.operation_type,
                OperationHistory.status,
                OperationHistory.execution_duration_ms,
                OperationHistory.created_at,
            )
            .where(*filters)
            .order_by(OperationHistory.created_at.desc())
            .limit(limit)
        )
        rows = db.execute(stmt).all()
        return [
            {
                "id": r.id,
                "algorithm_name": r.algorithm_name,
                "operation_type": r.operation_type,
                "status": r.status,
                "execution_duration_ms": float(r.execution_duration_ms) if r.execution_duration_ms is not None else 0.0,
                "created_at": r.created_at.isoformat() if hasattr(r.created_at, "isoformat") else str(r.created_at),
            }
            for r in rows
        ]
    except Exception as e:
        logger.warning("export_audit_records failed: %s", str(e))
        return []
