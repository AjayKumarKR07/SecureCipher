import logging
from typing import List, Optional, Tuple
from sqlalchemy import select, desc, func
from sqlalchemy.orm import Session
from app.models.history import OperationHistory
from app.schemas.history import OperationHistoryItem

logger = logging.getLogger(__name__)


def get_recent_history(
    db: Optional[Session], limit: int = 10
) -> Tuple[List[OperationHistoryItem], bool, Optional[str], int]:
    """
    Retrieves recent operation history records without sensitive payloads.
    Returns (items, database_connected, status_message, total_db_count).
    """
    if db is None:
        return (
            [],
            False,
            "Database connection not established. Configure DATABASE_URL in backend/.env to persist operations.",
            0,
        )

    try:
        # Get actual total count in the database (ignores limit)
        total_count = db.scalar(select(func.count()).select_from(OperationHistory)) or 0

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
        return items, True, None, total_count
    except Exception as e:
        logger.warning("Failed to query operation history: %s", str(e))
        return (
            [],
            False,
            "Database query could not be completed. Check database tables and status.",
            0,
        )


def record_audit_operation(
    db: Optional[Session],
    algorithm_name: str,
    operation_type: str,
    status: str,
    duration_ms: float,
) -> None:
    """
    Persists safe operational execution metadata to PostgreSQL history.
    
    SECURITY GUARANTEE:
    Plaintext, private keys, public keys, passphrases, derived keys, and ciphertexts
    are NEVER stored or logged.
    """
    if db is None:
        return

    try:
        audit_entry = OperationHistory(
            algorithm_name=algorithm_name,
            operation_type=operation_type,
            status=status,
            execution_duration_ms=round(duration_ms, 2),
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        logger.warning("Could not persist audit record to database: %s", str(e))
        try:
            db.rollback()
        except Exception:
            pass


def delete_history_item(db: Optional[Session], item_id: int) -> Tuple[bool, Optional[str]]:
    """
    Deletes a single audit record from PostgreSQL history by ID.
    Returns (success, error_message).
    """
    if db is None:
        return False, "Database connection not available"

    try:
        record = db.get(OperationHistory, item_id)
        if not record:
            return False, f"Audit record #{item_id} not found"

        db.delete(record)
        db.commit()
        logger.info("Deleted audit record #%s", item_id)
        return True, None
    except Exception as e:
        logger.warning("Failed to delete audit record #%s: %s", item_id, str(e))
        try:
            db.rollback()
        except Exception:
            pass
        return False, str(e)


def clear_all_history(db: Optional[Session]) -> tuple:
    """
    Deletes ALL audit records from PostgreSQL history.
    Returns (success, deleted_count, error_message).
    """
    if db is None:
        return False, 0, "Database connection not available"

    try:
        from sqlalchemy import delete as sa_delete
        result = db.execute(sa_delete(OperationHistory))
        db.commit()
        count = result.rowcount
        logger.info("Cleared all %s audit records from history", count)
        return True, count, None
    except Exception as e:
        logger.warning("Failed to clear all history: %s", str(e))
        try:
            db.rollback()
        except Exception:
            pass
        return False, 0, str(e)
