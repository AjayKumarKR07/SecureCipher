from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class OperationHistoryItem(BaseModel):
    id: int
    algorithm_name: str
    operation_type: str
    status: str
    execution_duration_ms: float
    created_at: datetime
    user_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class OperationHistoryResponse(BaseModel):
    items: List[OperationHistoryItem]
    total: int           # number of items returned (respects limit)
    total_count: int = 0  # actual total records in DB (ignores limit)
    database_connected: bool
    message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class DeleteHistoryResponse(BaseModel):
    success: bool
    deleted_id: int
    message: str


class ClearAllHistoryResponse(BaseModel):
    success: bool
    deleted_count: int
    message: str
