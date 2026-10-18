import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User, EmailOTP
from app.core.security import (
    hash_password,
    verify_password,
    validate_password_strength,
    generate_otp,
    hash_otp,
    verify_otp,
)
from app.core.config import settings
from app.services.email_service import (
    is_smtp_configured,
    get_missing_smtp_config,
    send_verification_email,
)
from app.schemas.auth import RequestOTPResponse

logger = logging.getLogger(__name__)

OTP_EXPIRY_MINUTES = 5
RESEND_COOLDOWN_SECONDS = 60
MAX_VERIFICATION_ATTEMPTS = 5


def ensure_utc(dt: datetime) -> datetime:
    """Ensures a datetime is timezone-aware in UTC across SQLite and PostgreSQL."""
    if dt is None:
        return datetime.now(timezone.utc)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def request_registration_otp(
    db: Session,
    full_name: str,
    email: str,
    password: str,
) -> RequestOTPResponse:
    """
    Validates registration parameters, checks for duplicate accounts,
    enforces a 60-second cooldown, generates a secure 6-digit OTP,
    hashes the OTP in PostgreSQL, and attempts real email dispatch.
    """
    normalized_email = email.strip().lower()

    # 1. Check if user with this email already exists
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead.",
        )

    # 2. Validate password strength
    valid_pwd, pwd_error = validate_password_strength(password)
    if not valid_pwd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pwd_error,
        )

    now = datetime.now(timezone.utc)

    # 3. Check for 60-second cooldown on existing active OTP
    recent_otp = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == normalized_email,
            EmailOTP.purpose == "registration",
            EmailOTP.is_used == False,
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if recent_otp:
        time_elapsed = (now - ensure_utc(recent_otp.created_at)).total_seconds()
        if time_elapsed < RESEND_COOLDOWN_SECONDS:
            remaining = int(RESEND_COOLDOWN_SECONDS - time_elapsed)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Please wait {remaining} seconds before requesting a new verification code.",
            )
        # Mark prior OTP as superseded
        recent_otp.is_used = True

    # 4. Generate cryptographically random 6-digit OTP
    otp_code = generate_otp()
    hashed_val = hash_otp(otp_code, normalized_email)

    expires_at = now + timedelta(minutes=OTP_EXPIRY_MINUTES)
    new_otp = EmailOTP(
        email=normalized_email,
        hashed_otp=hashed_val,
        purpose="registration",
        attempts=0,
        is_used=False,
        expires_at=expires_at,
    )
    db.add(new_otp)
    db.commit()

    # 5. Dispatch email or report missing configuration
    smtp_ready = is_smtp_configured()
    if smtp_ready:
        sent, err_msg = send_verification_email(
            to_email=normalized_email,
            recipient_name=full_name.strip(),
            otp_code=otp_code,
        )
        if not sent:
            logger.warning("SMTP delivery failed for %s: %s", normalized_email, err_msg)
            return RequestOTPResponse(
                status="smtp_error",
                message=f"Could not dispatch email: {err_msg}. Please check your SMTP configuration.",
                email=normalized_email,
                smtp_configured=True,
                expires_in_seconds=OTP_EXPIRY_MINUTES * 60,
                resend_cooldown_seconds=RESEND_COOLDOWN_SECONDS,
            )
        return RequestOTPResponse(
            status="success",
            message="A 6-digit verification code has been dispatched to your email address.",
            email=normalized_email,
            smtp_configured=True,
            expires_in_seconds=OTP_EXPIRY_MINUTES * 60,
            resend_cooldown_seconds=RESEND_COOLDOWN_SECONDS,
        )

    # In production mode, never expose dev OTP
    is_prod = settings.ENVIRONMENT.lower() == "production"
    if is_prod:
        logger.error("Production alert: SMTP unconfigured on server. Disallowing OTP generation.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email verification service is temporarily unavailable. Please configure SMTP credentials.",
        )

    # If SMTP is not configured in development, explain what is missing and provide dev OTP
    missing = get_missing_smtp_config()
    logger.info("Email delivery is not configured on server (development mode). Missing: %s", missing)

    return RequestOTPResponse(
        status="smtp_unconfigured",
        message=(
            "Email delivery service is unconfigured on the server (missing SMTP credentials in backend/.env). "
            f"Missing configuration: {', '.join(missing)}. "
            "For local testing and evaluation, a development verification code has been issued."
        ),
        email=normalized_email,
        smtp_configured=False,
        missing_config=missing,
        expires_in_seconds=OTP_EXPIRY_MINUTES * 60,
        resend_cooldown_seconds=RESEND_COOLDOWN_SECONDS,
        dev_otp=otp_code,
    )


def verify_otp_and_create_user(
    db: Session,
    full_name: str,
    email: str,
    password: str,
    otp: str,
) -> User:
    """
    Verifies the submitted OTP against stored HMAC hash.
    Enforces expiration and maximum 5 attempts.
    On success, creates and returns the new verified User with bcrypt password.
    """
    normalized_email = email.strip().lower()

    # Double check duplicate
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in instead.",
        )

    # Validate password strength
    valid_pwd, pwd_error = validate_password_strength(password)
    if not valid_pwd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pwd_error,
        )

    # Find active OTP record
    now = datetime.now(timezone.utc)
    otp_record = (
        db.query(EmailOTP)
        .filter(
            EmailOTP.email == normalized_email,
            EmailOTP.purpose == "registration",
            EmailOTP.is_used == False,
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active verification request found for this email. Please request a new code.",
        )

    # Check expiration
    if now > ensure_utc(otp_record.expires_at):
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The verification code has expired (5-minute limit). Please request a new code.",
        )

    # Enforce maximum attempts
    otp_record.attempts += 1
    if otp_record.attempts > MAX_VERIFICATION_ATTEMPTS:
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum verification attempts exceeded (5). Please request a new code.",
        )

    # Verify OTP against stored hash
    if not verify_otp(otp, normalized_email, otp_record.hashed_otp):
        if otp_record.attempts >= MAX_VERIFICATION_ATTEMPTS:
            otp_record.is_used = True
        db.commit()
        remaining = max(0, MAX_VERIFICATION_ATTEMPTS - otp_record.attempts)
        if remaining == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum verification attempts exceeded (5). This code has been invalidated. Please request a new code.",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid verification code. {remaining} attempt(s) remaining.",
        )

    # Mark OTP as successfully used
    otp_record.is_used = True

    # Hash password with bcrypt
    hashed_pwd = hash_password(password)

    new_user = User(
        full_name=full_name.strip(),
        email=normalized_email,
        hashed_password=hashed_pwd,
        is_active=True,
        is_verified=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info("Successfully registered and verified new user: %s (id=%d)", normalized_email, new_user.id)
    return new_user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> Optional[User]:
    """
    Validates user credentials against stored bcrypt hash.
    Returns User if valid, None otherwise.
    Safe against credential disclosure.
    """
    normalized_email = email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if not user:
        return None
    if not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def change_user_password(
    db: Session,
    user: User,
    current_password: str,
    new_password: str,
) -> bool:
    """
    Safely changes the user's password.
    Requires current password verification and validates complexity rules.
    """
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    valid_pwd, pwd_error = validate_password_strength(new_password)
    if not valid_pwd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=pwd_error,
        )

    if current_password == new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as your current password.",
        )

    user.hashed_password = hash_password(new_password)
    db.commit()
    db.refresh(user)
    logger.info("Password successfully updated for user %s (id=%d)", user.email, user.id)
    return True


def update_user_profile(
    db: Session,
    user: User,
    full_name: str,
) -> User:
    """
    Updates the authenticated user's profile details.
    """
    clean_name = full_name.strip()
    if len(clean_name) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name must be at least 2 characters.",
        )

    user.full_name = clean_name
    db.commit()
    db.refresh(user)
    logger.info("Profile updated for user %s (id=%d)", user.email, user.id)
    return user

