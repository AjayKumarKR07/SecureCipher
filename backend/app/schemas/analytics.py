"""
Pydantic schemas for the Security & Performance Analytics API.

SCOPE: All analytics are user-scoped. Every query is filtered to the
authenticated user's own audit records. No system-wide or cross-user
aggregates are exposed because this application has no administrator role.

DATA SOURCE: PostgreSQL operation_history table (audit metadata only).
Fields: id, algorithm_name, operation_type, status,
        execution_duration_ms, user_id, created_at.

PRIVACY: No plaintext, keys, passphrases, file contents, or
         secret-bearing payloads are stored or returned.
"""
from typing import Dict, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# ─── Summary ─────────────────────────────────────────────────────────────────

class AnalyticsSummary(BaseModel):
    """Top-level summary card data for the selected date range and filters."""
    total_operations: int = Field(description="Total audit records matching the selected filters.")
    successful_operations: int = Field(description="Records with status='success'.")
    failed_operations: int = Field(description="Records with status='failure'.")
    success_rate: Optional[float] = Field(
        description="successful/total*100. None when total_operations=0.",
    )
    # RSA-PSS invalid signature verifications (derived from operation_type+status)
    signature_verification_failures: int = Field(
        description="Count of signature_verification operations with status='failure'. "
                    "This includes invalid signatures (valid=false responses) as logged by RSA-PSS endpoints.",
    )
    avg_duration_ms: Optional[float] = Field(
        description="Mean execution_duration_ms across all matching records with duration > 0. "
                    "None when no valid duration measurements exist.",
    )
    min_duration_ms: Optional[float] = Field(description="Minimum valid duration. None if no data.")
    max_duration_ms: Optional[float] = Field(description="Maximum valid duration. None if no data.")
    duration_sample_count: int = Field(description="Number of records used for duration calculations.")
    date_range_start: datetime
    date_range_end: datetime
    filters_applied: Dict[str, Optional[str]] = Field(
        description="Echo of the applied filter parameters for display."
    )
    database_connected: bool
    note: Optional[str] = None


# ─── Time-series ──────────────────────────────────────────────────────────────

class TimeSeriesBucket(BaseModel):
    """Single time bucket (hour or day) in the operations-over-time chart."""
    bucket: str = Field(description="ISO-format UTC timestamp of the bucket start.")
    total: int
    successful: int
    failed: int


class OperationsOverTimeResponse(BaseModel):
    buckets: List[TimeSeriesBucket]
    granularity: str = Field(description="'hour' or 'day' depending on the selected range.")
    date_range_start: datetime
    date_range_end: datetime
    database_connected: bool


# ─── Distribution ────────────────────────────────────────────────────────────

class AlgorithmCount(BaseModel):
    algorithm: str
    total: int
    successful: int
    failed: int


class OperationTypeCount(BaseModel):
    operation_type: str
    total: int
    successful: int
    failed: int


class DistributionResponse(BaseModel):
    by_algorithm: List[AlgorithmCount]
    by_operation_type: List[OperationTypeCount]
    date_range_start: datetime
    date_range_end: datetime
    database_connected: bool


# ─── Performance ─────────────────────────────────────────────────────────────

class PerformanceEntry(BaseModel):
    group_label: str = Field(description="Algorithm name or operation type.")
    count: int = Field(description="Number of records with valid duration in this group.")
    avg_ms: float
    min_ms: float
    max_ms: float
    p50_ms: Optional[float] = Field(description="Median. None if insufficient data (count < 5).")
    p95_ms: Optional[float] = Field(description="95th percentile. None if count < 20.")
    p99_ms: Optional[float] = Field(description="99th percentile. None if count < 100.")


class PerformanceResponse(BaseModel):
    by_algorithm: List[PerformanceEntry]
    by_operation_type: List[PerformanceEntry]
    overall_avg_ms: Optional[float]
    overall_sample_count: int
    date_range_start: datetime
    date_range_end: datetime
    database_connected: bool
    note: str = (
        "Percentiles are calculated from this user's records in the selected period. "
        "A minimum sample size is required: p50 ≥ 5 records, p95 ≥ 20, p99 ≥ 100. "
        "File and text operations differ in workload; do not compare their durations directly."
    )


# ─── Security Events ─────────────────────────────────────────────────────────

class SecurityEvent(BaseModel):
    event_id: str = Field(description="Deterministic identifier to deduplicate repeated display.")
    category: str
    severity: str = Field(description="'info', 'warning', or 'alert'.")
    title: str
    description: str
    count: int = Field(description="Number of underlying audit records triggering this event.")
    window_start: Optional[datetime] = None
    window_end: Optional[datetime] = None
    rule: str = Field(description="Human-readable rule that triggered this indicator.")


class SecurityEventsResponse(BaseModel):
    events: List[SecurityEvent]
    anomaly_thresholds: Dict[str, int] = Field(
        description="The threshold values used for each rule, for transparency."
    )
    analysis_window_start: datetime
    analysis_window_end: datetime
    total_events: int
    database_connected: bool
    instrumentation_note: str = (
        "Security events are rule-based indicators derived from audit metadata. "
        "This is NOT a real-time intrusion-detection system. "
        "Authentication failures and request-level events are not currently instrumented "
        "in the operation_history table — only cryptographic-operation outcomes are available."
    )
