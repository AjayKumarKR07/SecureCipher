from datetime import datetime, timezone
from fastapi import APIRouter, Response, status
from app.core.config import settings
from app.db.session import check_database_connection
from app.schemas.health import HealthResponse, DatabaseHealthResponse

router = APIRouter(tags=["Health & Diagnostics"])


@router.get("/health", response_model=HealthResponse, summary="Backend Health Check")
def get_health() -> HealthResponse:
    """Returns the operational status and metadata of the SecureCipher backend."""
    return HealthResponse(
        status="ok",
        project=settings.PROJECT_NAME,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc),
        message="SecureCipher Cryptography API is running normally.",
    )


@router.get(
    "/health/database",
    response_model=DatabaseHealthResponse,
    summary="PostgreSQL Connectivity Verification",
)
def get_database_health(response: Response) -> DatabaseHealthResponse:
    """
    Tests and verifies live PostgreSQL database connectivity.
    Safely tests the connection without exposing credentials or internal traces.
    """
    db_status = check_database_connection()
    if not db_status.get("connected"):
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return DatabaseHealthResponse(
        status=db_status.get("status", "disconnected"),
        connected=db_status.get("connected", False),
        message=db_status.get("message", "Unable to establish database connection"),
        database=db_status.get("database"),
        user=db_status.get("user"),
        latency_ms=db_status.get("latency_ms"),
    )
