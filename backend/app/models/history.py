from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, func
from app.db.session import Base


class OperationHistory(Base):
    """
    Operation History Model.
    
    SECURITY NOTE:
    Never store plaintext data, keys, passwords, hashes of secrets,
    or uploaded file contents in this model. Only audit metadata is recorded.
    """
    __tablename__ = "operation_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    algorithm_name = Column(String(50), nullable=False, index=True)
    operation_type = Column(String(50), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="success")
    execution_duration_ms = Column(Float, nullable=False, default=0.0)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<OperationHistory id={self.id} algo={self.algorithm_name} op={self.operation_type} status={self.status}>"
