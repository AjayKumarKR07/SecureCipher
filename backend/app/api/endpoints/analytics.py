"""
Security & Performance Analytics Endpoints for SecureCipher.

SCOPE:
  All analytics endpoints are strictly user-scoped. Only the authenticated
  user's own cryptographic operation audit logs are aggregated and returned.
  No administrative or cross-tenant endpoints exist.

SECURITY:
  Requires valid Bearer JWT authentication (get_current_user).
  No plaintexts, passwords, secret keys, or raw file contents are returned.
"""
import io
import csv
import json
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.api.endpoints.auth import get_current_user
from app.schemas.analytics import (
    AnalyticsSummary,
    OperationsOverTimeResponse,
    DistributionResponse,
    PerformanceResponse,
    SecurityEventsResponse,
)
from app.services import analytics_service

router = APIRouter(tags=["Security & Performance Analytics"])


@router.get(
    "/analytics/summary",
    response_model=AnalyticsSummary,
    summary="Get user-scoped aggregate summary of cryptographic operations",
)
def get_analytics_summary(
    start_time: Optional[datetime] = Query(default=None, description="Start date (ISO 8601 UTC)"),
    end_time: Optional[datetime] = Query(default=None, description="End date (ISO 8601 UTC)"),
    algorithm: Optional[str] = Query(default=None, description="Filter by algorithm name (e.g. RSA-PSS, AES-GCM)"),
    operation_type: Optional[str] = Query(default=None, description="Filter by operation type (e.g. encrypt, sign)"),
    status: Optional[str] = Query(default=None, description="Filter by status (success, failure)"),
    current_user: User = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
) -> AnalyticsSummary:
    """
    Returns high-level KPI cards: total operations, success/failure counts,
    signature verification failures, execution duration averages, and sample sizes.
    """
    return analytics_service.get_analytics_summary(
        db=db,
        user_id=current_user.id,
        start=start_time,
        end=end_time,
        algorithm=algorithm,
        operation_type=operation_type,
        status_filter=status,
    )


@router.get(
    "/analytics/operations-over-time",
    response_model=OperationsOverTimeResponse,
    summary="Get time-series operation counts for charts",
)
def get_operations_over_time(
    start_time: Optional[datetime] = Query(default=None, description="Start date (ISO 8601 UTC)"),
    end_time: Optional[datetime] = Query(default=None, description="End date (ISO 8601 UTC)"),
    algorithm: Optional[str] = Query(default=None, description="Filter by algorithm"),
    operation_type: Optional[str] = Query(default=None, description="Filter by operation type"),
    current_user: User = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
) -> OperationsOverTimeResponse:
    """
    Aggregates user's operations into hourly or daily buckets for time-series charts.
    """
    return analytics_service.get_operations_over_time(
        db=db,
        user_id=current_user.id,
        start=start_time,
        end=end_time,
        algorithm=algorithm,
        operation_type=operation_type,
    )


@router.get(
    "/analytics/distribution",
    response_model=DistributionResponse,
    summary="Get algorithm and operation-type distribution breakdown",
)
def get_distribution(
    start_time: Optional[datetime] = Query(default=None, description="Start date (ISO 8601 UTC)"),
    end_time: Optional[datetime] = Query(default=None, description="End date (ISO 8601 UTC)"),
    current_user: User = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
) -> DistributionResponse:
    """
    Returns categorical breakdowns by algorithm and by operation type with success/failure splits.
    """
    return analytics_service.get_distribution(
        db=db,
        user_id=current_user.id,
        start=start_time,
        end=end_time,
    )


@router.get(
    "/analytics/performance",
    response_model=PerformanceResponse,
    summary="Get latency & performance percentiles (min, avg, max, p50, p95, p99)",
)
def get_performance(
    start_time: Optional[datetime] = Query(default=None, description="Start date (ISO 8601 UTC)"),
    end_time: Optional[datetime] = Query(default=None, description="End date (ISO 8601 UTC)"),
    current_user: User = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
) -> PerformanceResponse:
    """
    Provides latency statistics per algorithm and per operation type.
    Percentiles require minimum sample thresholds (p50: >=5, p95: >=20, p99: >=100).
    """
    return analytics_service.get_performance(
        db=db,
        user_id=current_user.id,
        start=start_time,
        end=end_time,
    )


@router.get(
    "/analytics/security-events",
    response_model=SecurityEventsResponse,
    summary="Get rule-based security anomaly and failure spike indicators",
)
def get_security_events(
    start_time: Optional[datetime] = Query(default=None, description="Start date (ISO 8601 UTC)"),
    end_time: Optional[datetime] = Query(default=None, description="End date (ISO 8601 UTC)"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Page size"),
    current_user: User = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
) -> SecurityEventsResponse:
    """
    Scans audit log for heuristic anomalies:
    - Multiple signature verification failures in 1h
    - High absolute error spikes
    - Failure ratios exceeding 50% in an hour
    """
    return analytics_service.get_security_events(
        db=db,
        user_id=current_user.id,
        start=start_time,
        end=end_time,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/analytics/export",
    summary="Export filtered audit logs as sanitized CSV or JSON",
)
def export_analytics(
    format: str = Query(default="csv", pattern="^(csv|json)$", description="Export format: 'csv' or 'json'"),
    start_time: Optional[datetime] = Query(default=None, description="Start date"),
    end_time: Optional[datetime] = Query(default=None, description="End date"),
    algorithm: Optional[str] = Query(default=None, description="Filter by algorithm"),
    operation_type: Optional[str] = Query(default=None, description="Filter by operation type"),
    status: Optional[str] = Query(default=None, description="Filter by status"),
    current_user: User = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
):
    """
    Exports sanitized audit metadata records belonging to the authenticated user.
    Plaintexts, keys, passphrases, and file contents are never stored or exported.
    """
    records = analytics_service.export_audit_records(
        db=db,
        user_id=current_user.id,
        start=start_time,
        end=end_time,
        algorithm=algorithm,
        operation_type=operation_type,
        status_filter=status,
    )

    now_utc = datetime.now(timezone.utc)
    timestamp_str = now_utc.strftime("%Y%m%d_%H%M%S")

    if format.lower() == "json":
        json_data = json.dumps(
            {
                "user_id": current_user.id,
                "exported_at": now_utc.isoformat(),
                "total_records": len(records),
                "records": records,
            },
            indent=2,
        )
        return Response(
            content=json_data,
            media_type="application/json",
            headers={
                "Content-Disposition": f'attachment; filename="securecipher_audit_{timestamp_str}.json"'
            },
        )

    # Default: CSV export with formula injection sanitization (CWE-1236)
    output = io.StringIO()
    fieldnames = ["id", "algorithm_name", "operation_type", "status", "execution_duration_ms", "created_at"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for rec in records:
        sanitized_rec = {}
        for k, v in rec.items():
            if isinstance(v, str) and v:
                stripped_spaces = v.lstrip(" ")
                stripped_all = v.lstrip(" \t\r\n\v\f")
                if (stripped_spaces and stripped_spaces[0] in ("=", "+", "-", "@", "\t", "\r")) or \
                   (stripped_all and stripped_all[0] in ("=", "+", "-", "@")):
                    sanitized_rec[k] = f"'{v}"
                else:
                    sanitized_rec[k] = v
            else:
                sanitized_rec[k] = v
        writer.writerow(sanitized_rec)

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="securecipher_audit_{timestamp_str}.csv"'
        },
    )
