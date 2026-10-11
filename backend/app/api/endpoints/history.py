from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.history import OperationHistoryResponse
from app.services.history_service import get_recent_history

router = APIRouter(tags=["Operation History"])


@router.get("/history", response_model=OperationHistoryResponse, summary="Get Recent Cryptographic Operations History")
def list_operation_history(
    limit: int = Query(default=20, ge=1, le=100, description="Max operations to retrieve"),
    db: Optional[Session] = Depends(get_db),
) -> OperationHistoryResponse:
    """
    Returns recent cryptographic operation metadata.
    Initially empty.
    
    SECURITY GUARANTEE:
    This endpoint and the underlying persistence layer strictly omit plaintext
    messages, uploaded file contents, passwords, and cryptographic keys.
    """
    items, db_connected, msg = get_recent_history(db, limit=limit)
    return OperationHistoryResponse(
        items=items,
        total=len(items),
        database_connected=db_connected,
        message=msg,
    )
