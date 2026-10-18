import logging
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.schemas.auth import (
    RequestOTPRequest,
    RequestOTPResponse,
    VerifyOTPRegisterRequest,
    LoginRequest,
    UserResponse,
    AuthTokenResponse,
    AuthStatusResponse,
    ChangePasswordRequest,
    UpdateProfileRequest,
)
from app.services.auth_service import (
    request_registration_otp,
    verify_otp_and_create_user,
    authenticate_user,
    change_user_password,
    update_user_profile,
)

logger = logging.getLogger(__name__)

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
security_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency to extract and authenticate the current user from Bearer JWT.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available.",
        )
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing or malformed.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication session.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_email = payload["sub"]
    user = db.query(User).filter(User.email == user_email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated or no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Optional[Session] = Depends(get_db),
) -> Optional[User]:
    """
    Optional dependency: extracts and returns User if a valid Bearer token is present,
    or None if the caller is unauthenticated or the token is invalid/expired.
    """
    if db is None or not credentials or not credentials.credentials:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        if not payload or "sub" not in payload:
            return None
        user_email = payload["sub"]
        return db.query(User).filter(User.email == user_email, User.is_active == True).first()
    except Exception:
        return None


@auth_router.post(
    "/register/request-otp",
    response_model=RequestOTPResponse,
    summary="Request a 6-digit email verification OTP",
)
def request_otp_endpoint(
    req: RequestOTPRequest,
    db: Session = Depends(get_db),
):
    """
    Step 1 of Registration:
    Validates user credentials, ensures email is not taken,
    generates a 6-digit OTP, stores its HMAC hash in PostgreSQL,
    and dispatches a real verification email via SMTP if configured.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is currently unavailable.",
        )
    return request_registration_otp(
        db=db,
        full_name=req.full_name,
        email=req.email,
        password=req.password,
    )


@auth_router.post(
    "/register/verify-otp",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Verify OTP and complete user account registration",
)
def verify_otp_endpoint(
    req: VerifyOTPRegisterRequest,
    db: Session = Depends(get_db),
):
    """
    Step 2 of Registration:
    Verifies the 6-digit code against the stored hash.
    Enforces 5-minute expiry and max 5 attempts.
    On success, securely creates the user with a bcrypt hashed password
    and issues an authenticated session JWT.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is currently unavailable.",
        )

    new_user = verify_otp_and_create_user(
        db=db,
        full_name=req.full_name,
        email=req.email,
        password=req.password,
        otp=req.otp,
    )

    # Issue access token
    token = create_access_token(
        data={"sub": new_user.email, "uid": new_user.id, "name": new_user.full_name}
    )

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(new_user),
    )


@auth_router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Authenticate user and issue JWT access token",
)
def login_endpoint(
    req: LoginRequest,
    db: Session = Depends(get_db),
):
    """
    Authenticates a user using email and password.
    Validates credentials with bcrypt against PostgreSQL.
    Returns JWT access token on success.
    """
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database is currently unavailable.",
        )

    user = authenticate_user(db=db, email=req.email, password=req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials.",
        )

    expires_delta = timedelta(days=7) if req.remember_me else timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        data={"sub": user.email, "uid": user.id, "name": user.full_name},
        expires_delta=expires_delta,
    )

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=int(expires_delta.total_seconds()),
        user=UserResponse.model_validate(user),
    )


@auth_router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user profile",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """
    Returns the profile information of the currently authenticated user.
    Requires a valid Bearer JWT.
    """
    return UserResponse.model_validate(current_user)


@auth_router.put(
    "/profile",
    response_model=UserResponse,
    summary="Update authenticated user profile",
)
def update_profile_endpoint(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Updates the authenticated user's profile details.
    """
    return update_user_profile(db=db, user=current_user, full_name=req.full_name)


@auth_router.post(
    "/change-password",
    summary="Change user account password",
)
def change_password_endpoint(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Changes the authenticated user's password.
    Requires current password verification and enforces password complexity rules.
    """
    change_user_password(
        db=db,
        user=current_user,
        current_password=req.current_password,
        new_password=req.new_password,
    )
    return {"status": "success", "message": "Password changed successfully."}


@auth_router.post(
    "/logout",
    summary="Logout user session",
)
def logout_endpoint():
    """
    Client-side session termination.
    """
    return {"status": "success", "message": "Session terminated successfully."}
