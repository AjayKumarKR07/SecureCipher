from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime


class HealthResponse(BaseModel):
    status: str
    project: str
    version: str
    timestamp: datetime
    message: str

    model_config = ConfigDict(from_attributes=True)


class DatabaseHealthResponse(BaseModel):
    status: str
    connected: bool
    message: str
    database: Optional[str] = None
    user: Optional[str] = None
    latency_ms: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)
