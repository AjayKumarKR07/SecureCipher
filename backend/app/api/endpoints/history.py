from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.api.endpoints.auth import get_current_user
from app.schemas.history import OperationHistoryResponse, DeleteHistoryResponse, ClearAllHistoryResponse
from app.services.history_service import get_recent_history, delete_history_item, clear_all_history

router = APIRouter(tags=["Operation History"])


@router.get("/history", response_model=OperationHistoryResponse, summary="Get Recent Cryptographic Operations History")
def list_operation_history(
    limit: int = Query(default=20, ge=1, le=100, description="Max operations to retrieve (1-100)"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    algorithm: Optional[str] = Query(default=None, description="Filter by algorithm name (e.g. AES, RSA, SHA-256)"),
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by execution status (e.g. success, failure)"),
    current_user: User = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
) -> OperationHistoryResponse:
    """
    Returns recent cryptographic operation metadata scoped strictly to the authenticated user.
    Supports filtering by algorithm and execution status, with offset pagination.

    SECURITY GUARANTEE:
    - Requires valid Bearer JWT authentication.
    - Strictly filters records to the authenticated user's account.
    - Omit plaintext messages, uploaded file contents, passwords, and cryptographic keys.
    """
    items, db_connected, msg, total_count = get_recent_history(
        db=db,
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        algorithm=algorithm,
        status=status_filter,
    )
    return OperationHistoryResponse(
        items=items,
        total=len(items),
        total_count=total_count,
        database_connected=db_connected,
        message=msg,
    )


@router.delete("/history", response_model=ClearAllHistoryResponse, summary="Clear Authenticated User's Operation History")
def clear_all_operation_history(
    current_user: User = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
) -> ClearAllHistoryResponse:
    """
    Permanently deletes all cryptographic operation audit records belonging to the authenticated user.
    Never deletes or alters other users' audit records.
    """
    success, deleted_count, error_msg = clear_all_history(db=db, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg or "Failed to clear audit history",
        )
    return ClearAllHistoryResponse(
        success=True,
        deleted_count=deleted_count,
        message=f"Successfully deleted {deleted_count} audit record(s) belonging to your account.",
    )


@router.delete("/history/{item_id}", response_model=DeleteHistoryResponse, summary="Delete Single Cryptographic Operation Record")
def delete_operation_history_record(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Optional[Session] = Depends(get_db),
) -> DeleteHistoryResponse:
    """
    Deletes a specific cryptographic operation audit record from PostgreSQL history.
    Enforces authorization: users can only delete records belonging to their own account.
    Returns 404 if the record does not exist or belongs to another user.
    """
    success, error_msg = delete_history_item(db=db, item_id=item_id, user_id=current_user.id)
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
