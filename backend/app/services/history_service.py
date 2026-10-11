import logging
from typing import List, Optional, Tuple
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from app.models.history import OperationHistory
from app.schemas.history import OperationHistoryItem

logger = logging.getLogger(__name__)


def get_recent_history(
    db: Optional[Session], limit: int = 10
) -> Tuple[List[OperationHistoryItem], bool, Optional[str]]:
    """
    Retrieves recent operation history records without sensitive payloads.
    Returns (items, database_connected, status_message).
    """
    if db is None:
        return (
            [],
            False,
            "Database connection not established. Configure DATABASE_URL in backend/.env to persist operations.",
        )

    try:
        stmt = (
            select(OperationHistory)
            .order_by(desc(OperationHistory.created_at))
            .limit(limit)
        )
        results = db.scalars(stmt).all()
        items = [
            OperationHistoryItem(
                id=record.id,
                algorithm_name=record.algorithm_name,
                operation_type=record.operation_type,
                status=record.status,
                execution_duration_ms=record.execution_duration_ms,
                created_at=record.created_at,
            )
            for record in results
        ]
        return items, True, None
    except Exception as e:
        logger.warning("Failed to query operation history: %s", str(e))
        return (
            [],
            False,
            "Database query could not be completed. Check database tables and status.",
        )
