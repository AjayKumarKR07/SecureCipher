from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.history import OperationHistoryResponse, DeleteHistoryResponse
from app.services.history_service import get_recent_history, delete_history_item

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
    items, db_connected, msg, total_count = get_recent_history(db, limit=limit)
    return OperationHistoryResponse(
        items=items,
        total=len(items),
        total_count=total_count,
        database_connected=db_connected,
        message=msg,
    )


@router.delete("/history/{item_id}", response_model=DeleteHistoryResponse, summary="Delete Cryptographic Operation History Record")
def delete_operation_history_record(
    item_id: int,
    db: Optional[Session] = Depends(get_db),
) -> DeleteHistoryResponse:
    """
    Deletes a specific cryptographic operation audit record from PostgreSQL history.
    """
    success, error_msg = delete_history_item(db, item_id)
    if not success:
        if error_msg and "not found" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or f"Failed to delete audit record #{item_id}",
        )

    return DeleteHistoryResponse(
        success=True,
        deleted_id=item_id,
        message=f"Audit record #{item_id} deleted successfully.",
    )

