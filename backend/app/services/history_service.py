import logging
from typing import List, Optional, Tuple
from sqlalchemy import select, desc, func, delete as sa_delete
from sqlalchemy.orm import Session
from app.models.history import OperationHistory
from app.schemas.history import OperationHistoryItem

logger = logging.getLogger(__name__)


def get_recent_history(
    db: Optional[Session],
    user_id: Optional[int] = None,
    limit: int = 20,
    offset: int = 0,
    algorithm: Optional[str] = None,
    status: Optional[str] = None,
) -> Tuple[List[OperationHistoryItem], bool, Optional[str], int]:
    """
    Retrieves recent operation history records scoped to the authenticated user.
    Supports filtering by algorithm and execution status, with offset pagination.
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
        # Build base filter conditions
        filters = []
        if user_id is not None:
            filters.append(OperationHistory.user_id == user_id)
        if algorithm and algorithm.strip().upper() != "ALL":
            filters.append(OperationHistory.algorithm_name.ilike(f"%{algorithm.strip()}%"))
        if status and status.strip().upper() != "ALL":
            filters.append(OperationHistory.status == status.strip().lower())

        # Total count matching filters
        count_stmt = select(func.count()).select_from(OperationHistory)
        if filters:
            count_stmt = count_stmt.where(*filters)
        total_count = db.scalar(count_stmt) or 0

        # Query items with pagination
        stmt = (
            select(OperationHistory)
            .order_by(desc(OperationHistory.created_at))
            .offset(max(0, offset))
            .limit(min(max(1, limit), 100))
        )
        if filters:
            stmt = stmt.where(*filters)

        results = db.scalars(stmt).all()
        items = [
            OperationHistoryItem(
                id=record.id,
                algorithm_name=record.algorithm_name,
                operation_type=record.operation_type,
                status=record.status,
                execution_duration_ms=record.execution_duration_ms,
                created_at=record.created_at,
                user_id=record.user_id,
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
    user_id: Optional[int] = None,
) -> None:
    """
    Persists safe operational execution metadata to PostgreSQL history.
    Associates the audit record with the authenticated user if present.
    
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
            user_id=user_id,
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        logger.warning("Could not persist audit record to database: %s", str(e))
        try:
            db.rollback()
        except Exception:
            pass


def delete_history_item(
    db: Optional[Session],
    item_id: int,
    user_id: Optional[int] = None,
) -> Tuple[bool, Optional[str]]:
    """
    Deletes a single audit record from PostgreSQL history by ID, enforcing user ownership.
    Returns (success, error_message).
    """
    if db is None:
        return False, "Database connection not available"

    try:
        record = db.get(OperationHistory, item_id)
        if not record:
            return False, f"Audit record #{item_id} not found"

        # Enforce user authorization: record must belong to current user
        if user_id is not None and record.user_id != user_id:
            logger.warning("Unauthorized delete attempt: User %s attempted to delete record #%s owned by %s", user_id, item_id, record.user_id)
            return False, f"Audit record #{item_id} not found"

        db.delete(record)
        db.commit()
        logger.info("Deleted audit record #%s for user %s", item_id, user_id)
        return True, None
    except Exception as e:
        logger.warning("Failed to delete audit record #%s: %s", item_id, str(e))
        try:
            db.rollback()
        except Exception:
            pass
        return False, str(e)


def clear_all_history(
    db: Optional[Session],
    user_id: Optional[int] = None,
) -> tuple:
    """
    Deletes audit records belonging EXCLUSIVELY to the authenticated user.
    Prevents cross-user deletion.
    Returns (success, deleted_count, error_message).
    """
    if db is None:
        return False, 0, "Database connection not available"

    if user_id is None:
        return False, 0, "Authentication required to clear audit history"

    try:
        stmt = sa_delete(OperationHistory).where(OperationHistory.user_id == user_id)
        result = db.execute(stmt)
        db.commit()
        count = result.rowcount
        logger.info("Cleared %s audit records for user id=%s", count, user_id)
        return True, count, None
    except Exception as e:
        logger.warning("Failed to clear history for user %s: %s", user_id, str(e))
        try:
            db.rollback()
        except Exception:
            pass
        return False, 0, str(e)
