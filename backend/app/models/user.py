from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from app.db.session import Base


class User(Base):
    """
    User Account Model.

    SECURITY NOTE:
    Never store plaintext passwords. The hashed_password column stores
    a one-way salted bcrypt hash.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    is_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=lambda: datetime.now(timezone.utc),
        default=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} is_verified={self.is_verified}>"


class EmailOTP(Base):
    """
    One-Time Password (OTP) Verification Model.

    SECURITY NOTE:
    Never store plaintext OTP values. Hashed with SHA-256 and salted.
    Expires within 5 minutes. Enforces max 5 verification attempts.
    """
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), index=True, nullable=False)
    hashed_otp = Column(String(255), nullable=False)
    purpose = Column(String(50), nullable=False, default="registration")
    attempts = Column(Integer, nullable=False, default=0)
    is_used = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
    )
    expires_at = Column(DateTime(timezone=True), nullable=False)

    def __repr__(self) -> str:
        return f"<EmailOTP id={self.id} email={self.email} purpose={self.purpose} is_used={self.is_used}>"
