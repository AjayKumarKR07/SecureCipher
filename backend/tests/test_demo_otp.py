"""
Tests for Explicit Demo OTP Mode (Registration, Verification, Expiry, and Security Safeguards).
"""
import re
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.config import settings
from app.db.session import Base, get_db
from app.models.user import User, EmailOTP

# Isolated in-memory SQLite for self-contained testing without mutating external databases
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_test_db():
    """Create isolated in-memory tables before each test and tear down cleanly."""
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def clean_db():
    """Provides a session to the isolated test database."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_demo_otp_disabled_by_default():
    """Verify DEMO_OTP_ENABLED defaults to False."""
    assert settings.DEMO_OTP_ENABLED is False


def test_demo_otp_request_in_demo_mode(clean_db, monkeypatch):
    """When DEMO_OTP_ENABLED=True, registration generates a demo OTP without sending email."""
    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", True)

    client = TestClient(app)
    res = client.post(
        "/api/auth/register/request-otp",
        json={
            "full_name": "Demo Analyst",
            "email": "demo_evaluator@securecipher.org",
            "password": "StrongPassword#2026",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "demo_mode"
    assert data["demo_mode"] is True
    assert "demo_otp" in data
    assert re.match(r"^\d{6}$", data["demo_otp"])
    assert "demonstration mode" in data["message"].lower()


def test_demo_otp_verification_and_account_creation(clean_db, monkeypatch):
    """Verify that account creation succeeds using the generated demo OTP."""
    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", True)

    client = TestClient(app)
    req_res = client.post(
        "/api/auth/register/request-otp",
        json={
            "full_name": "Demo User",
            "email": "demo_user@securecipher.org",
            "password": "StrongPassword#2026",
        },
    )
    assert req_res.status_code == 200
    demo_otp = req_res.json()["demo_otp"]

    # Step 2: Verify OTP
    verify_res = client.post(
        "/api/auth/register/verify-otp",
        json={
            "full_name": "Demo User",
            "email": "demo_user@securecipher.org",
            "password": "StrongPassword#2026",
            "otp": demo_otp,
        },
    )
    assert verify_res.status_code == 201
    vdata = verify_res.json()
    assert "access_token" in vdata
    assert vdata["token_type"] == "bearer"
    assert vdata["user"]["email"] == "demo_user@securecipher.org"
    assert vdata["user"]["is_verified"] is True

    # Confirm user exists in isolated test DB
    db_user = clean_db.query(User).filter(User.email == "demo_user@securecipher.org").first()
    assert db_user is not None
    assert db_user.is_verified is True


def test_demo_otp_verification_rejects_invalid_otp(clean_db, monkeypatch):
    """Submitting an incorrect 6-digit code returns 400 Bad Request."""
    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", True)

    client = TestClient(app)
    req_res = client.post(
        "/api/auth/register/request-otp",
        json={
            "full_name": "Demo Tester",
            "email": "invalid_otp_test@securecipher.org",
            "password": "StrongPassword#2026",
        },
    )
    assert req_res.status_code == 200
    real_otp = req_res.json()["demo_otp"]

    # Wrong OTP
    wrong_otp = "000000" if real_otp != "000000" else "111111"
    verify_res = client.post(
        "/api/auth/register/verify-otp",
        json={
            "full_name": "Demo Tester",
            "email": "invalid_otp_test@securecipher.org",
            "password": "StrongPassword#2026",
            "otp": wrong_otp,
        },
    )
    assert verify_res.status_code == 400
    assert "invalid verification code" in verify_res.json()["detail"].lower()


def test_demo_otp_verification_rejects_expired_otp(clean_db, monkeypatch):
    """An expired OTP code returns 400 with an expiration explanation."""
    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", True)

    client = TestClient(app)
    req_res = client.post(
        "/api/auth/register/request-otp",
        json={
            "full_name": "Expired Tester",
            "email": "expired_test@securecipher.org",
            "password": "StrongPassword#2026",
        },
    )
    assert req_res.status_code == 200
    demo_otp = req_res.json()["demo_otp"]

    # Fast-forward OTP expiration in database
    otp_record = (
        clean_db.query(EmailOTP)
        .filter(EmailOTP.email == "expired_test@securecipher.org")
        .first()
    )
    assert otp_record is not None
    otp_record.expires_at = datetime.now(timezone.utc) - timedelta(minutes=5)
    clean_db.commit()

    # Attempt to verify expired OTP
    verify_res = client.post(
        "/api/auth/register/verify-otp",
        json={
            "full_name": "Expired Tester",
            "email": "expired_test@securecipher.org",
            "password": "StrongPassword#2026",
            "otp": demo_otp,
        },
    )
    assert verify_res.status_code == 400
    assert "expired" in verify_res.json()["detail"].lower()


def test_demo_otp_lockout_after_max_failed_attempts(clean_db, monkeypatch):
    """Submitting 5 invalid codes locks out the verification request."""
    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", True)

    client = TestClient(app)
    req_res = client.post(
        "/api/auth/register/request-otp",
        json={
            "full_name": "Lockout Tester",
            "email": "lockout_test@securecipher.org",
            "password": "StrongPassword#2026",
        },
    )
    assert req_res.status_code == 200
    real_otp = req_res.json()["demo_otp"]
    wrong_otp = "000000" if real_otp != "000000" else "111111"

    # Attempt 5 times with wrong code
    for i in range(5):
        res_fail = client.post(
            "/api/auth/register/verify-otp",
            json={
                "full_name": "Lockout Tester",
                "email": "lockout_test@securecipher.org",
                "password": "StrongPassword#2026",
                "otp": wrong_otp,
            },
        )
        assert res_fail.status_code == 400

    # Even submitting the real code now must be rejected due to lockout
    res_locked = client.post(
        "/api/auth/register/verify-otp",
        json={
            "full_name": "Lockout Tester",
            "email": "lockout_test@securecipher.org",
            "password": "StrongPassword#2026",
            "otp": real_otp,
        },
    )
    assert res_locked.status_code == 400
    assert (
        "revoked" in res_locked.json()["detail"].lower()
        or "too many" in res_locked.json()["detail"].lower()
        or "no active" in res_locked.json()["detail"].lower()
    )


def test_demo_mode_disabled_blocks_otp_leak_in_production(clean_db, monkeypatch):
    """When DEMO_OTP_ENABLED=False in production/staging without SMTP, OTP is never leaked."""
    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", False)
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "SMTP_HOST", None)

    client = TestClient(app)
    res = client.post(
        "/api/auth/register/request-otp",
        json={
            "full_name": "Prod Security",
            "email": "prod_sec@securecipher.org",
            "password": "StrongPassword#2026",
        },
    )
    assert res.status_code == 503
    assert "demo_otp" not in res.json()
    assert "dev_otp" not in res.json()


def test_demo_otp_never_logged(clean_db, monkeypatch, caplog):
    """Ensure raw 6-digit OTP codes and secrets are never printed to logs."""
    monkeypatch.setattr(settings, "DEMO_OTP_ENABLED", True)

    client = TestClient(app)
    with caplog.at_level("DEBUG"):
        req_res = client.post(
            "/api/auth/register/request-otp",
            json={
                "full_name": "Audit Log Tester",
                "email": "audit_log@securecipher.org",
                "password": "StrongPassword#2026",
            },
        )
        demo_otp = req_res.json()["demo_otp"]

    # Verify that the actual 6-digit OTP was never captured in the logger output
    for record in caplog.records:
        assert demo_otp not in record.message
        assert "StrongPassword#2026" not in record.message
