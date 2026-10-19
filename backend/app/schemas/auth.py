from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RequestOTPRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="User's full name")
    email: EmailStr = Field(..., description="Valid email address for verification")
    password: str = Field(..., min_length=8, max_length=128, description="Account password (must meet complexity rules)")


class RequestOTPResponse(BaseModel):
    status: str
    message: str
    email: str
    smtp_configured: bool
    expires_in_seconds: int = 300
    resend_cooldown_seconds: int = 60
    missing_config: Optional[List[str]] = None
    dev_otp: Optional[str] = None
    demo_otp: Optional[str] = None
    demo_mode: bool = False


class VerifyOTPRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)
    remember_me: Optional[bool] = False


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class AuthStatusResponse(BaseModel):
    authenticated: bool
    user: Optional[UserResponse] = None


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128, description="Current password for identity confirmation")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password meeting complexity rules")


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Updated full name")

