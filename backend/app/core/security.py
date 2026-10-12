import hmac
import hashlib
import secrets
import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Tuple
import bcrypt
import jwt
from app.core.config import settings


def hash_password(password: str) -> str:
    """
    Hashes a plaintext password using bcrypt with a random salt.
    Never stores plaintext passwords.
    """
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against a stored bcrypt hash.
    Safe against timing attacks.
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validates password complexity requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter (A-Z)."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter (a-z)."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one numeric digit (0-9)."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>\-_+=~`]", password):
        return False, "Password must contain at least one special character (e.g. !@#$%^&*)."
    return True, None


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates a signed JWT access token containing subject claims.
    """
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and verifies a JWT access token.
    Returns payload dictionary or None if invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def generate_otp() -> str:
    """
    Generates a cryptographically secure 6-digit numeric OTP.
    """
    # 100000 to 999999 inclusive
    code_int = secrets.randbelow(900000) + 100000
    return str(code_int)


def hash_otp(otp: str, email: str) -> str:
    """
    Computes HMAC-SHA256 of the OTP bound to the user's normalized email.
    The plaintext OTP is never persisted in the database.
    """
    key = settings.JWT_SECRET_KEY.encode("utf-8")
    message = f"{email.strip().lower()}:{otp.strip()}".encode("utf-8")
    return hmac.new(key, message, hashlib.sha256).hexdigest()


def verify_otp(otp: str, email: str, hashed_otp: str) -> bool:
    """
    Constant-time comparison verifying the supplied OTP against the stored HMAC.
    """
    expected_hash = hash_otp(otp, email)
    return hmac.compare_digest(expected_hash, hashed_otp)
