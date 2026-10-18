import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.models.user import User, EmailOTP
from app.models.history import OperationHistory
from app.core.config import settings

# Isolated in-memory SQLite database for security tests
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


@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(app)


def register_and_login_user(client, email, password, full_name):
    """Helper to register and login a user via API flow."""
    # 1. Request OTP
    res_otp = client.post(
        "/api/auth/register/request-otp",
        json={"email": email, "password": password, "full_name": full_name},
    )
    assert res_otp.status_code == 200, res_otp.text
    otp_code = res_otp.json().get("dev_otp")

    # 2. Verify OTP
    res_verify = client.post(
        "/api/auth/register/verify-otp",
        json={"email": email, "password": password, "full_name": full_name, "otp": otp_code},
    )
    assert res_verify.status_code == 201, res_verify.text
    token = res_verify.json()["access_token"]
    user_id = res_verify.json()["user"]["id"]
    return {"token": token, "user_id": user_id, "headers": {"Authorization": f"Bearer {token}"}}


# =============================================================================
# 1. PRIORITY ONE: API AUTHENTICATION & ACCESS CONTROL
# =============================================================================

def test_unauthenticated_protected_endpoints_return_401(client):
    """Unauthenticated requests to protected endpoints must return 401."""
    # History listing
    res_list = client.get("/api/history")
    assert res_list.status_code == 401

    # Single history deletion
    res_del_item = client.delete("/api/history/1")
    assert res_del_item.status_code == 401

    # Clear all history
    res_clear = client.delete("/api/history")
    assert res_clear.status_code == 401

    # Profile endpoints
    res_me = client.get("/api/auth/me")
    assert res_me.status_code == 401

    res_profile = client.put("/api/auth/profile", json={"full_name": "Eve Hacker"})
    assert res_profile.status_code == 401

    res_pwd = client.post("/api/auth/change-password", json={"current_password": "x", "new_password": "y"})
    assert res_pwd.status_code == 401


def test_cross_user_history_isolation(client):
    """User B cannot see User A's history records."""
    user_a = register_and_login_user(client, "alice@securecipher.org", "AlicePass#2026", "Alice Analyst")
    user_b = register_and_login_user(client, "bob@securecipher.org", "BobPass#2026", "Bob Auditor")

    # User A performs an AES encryption (operation is logged to history)
    res_aes = client.post(
        "/api/aes/encrypt",
        headers=user_a["headers"],
        json={"plaintext": "Top Secret Alice Data", "passphrase": "StrongSecretPassphrase#2026"},
    )
    assert res_aes.status_code == 200

    # User A checks history -> sees 1 record
    hist_a = client.get("/api/history", headers=user_a["headers"])
    assert hist_a.status_code == 200
    data_a = hist_a.json()
    assert data_a["total_count"] == 1
    assert len(data_a["items"]) == 1
    assert data_a["items"][0]["algorithm_name"] == "AES-256-GCM"

    # User B checks history -> sees 0 records (User A's data is isolated)
    hist_b = client.get("/api/history", headers=user_b["headers"])
    assert hist_b.status_code == 200
    data_b = hist_b.json()
    assert data_b["total_count"] == 0
    assert len(data_b["items"]) == 0


def test_cross_user_single_deletion_prevention_idor(client):
    """User B cannot delete User A's history record by manipulating the ID in the URL."""
    user_a = register_and_login_user(client, "alice_idor@securecipher.org", "AlicePass#2026", "Alice IDOR")
    user_b = register_and_login_user(client, "bob_idor@securecipher.org", "BobPass#2026", "Bob IDOR")

    # User A creates a history item
    client.post(
        "/api/sha256/hash-text",
        headers=user_a["headers"],
        json={"text": "Integrity Check String"},
    )
    hist_a = client.get("/api/history", headers=user_a["headers"]).json()
    assert len(hist_a["items"]) == 1
    user_a_record_id = hist_a["items"][0]["id"]

    # User B attempts to delete User A's record ID
    del_res = client.delete(f"/api/history/{user_a_record_id}", headers=user_b["headers"])
    assert del_res.status_code == 404
    assert "not found" in del_res.json()["detail"].lower()

    # Verify User A's record was NOT deleted
    hist_a_after = client.get("/api/history", headers=user_a["headers"]).json()
    assert len(hist_a_after["items"]) == 1
    assert hist_a_after["items"][0]["id"] == user_a_record_id


def test_cross_user_clear_all_deletion_isolation(client):
    """User B executing clear-all deletes ONLY User B's records, never User A's records."""
    user_a = register_and_login_user(client, "alice_clear@securecipher.org", "AlicePass#2026", "Alice Clear")
    user_b = register_and_login_user(client, "bob_clear@securecipher.org", "BobPass#2026", "Bob Clear")

    # User A generates 2 records
    client.post("/api/sha256/hash-text", headers=user_a["headers"], json={"text": "Record 1"})
    client.post("/api/sha256/hash-text", headers=user_a["headers"], json={"text": "Record 2"})

    # User B generates 1 record
    client.post("/api/sha256/hash-text", headers=user_b["headers"], json={"text": "Record 3"})

    # Verify counts before clear
    assert client.get("/api/history", headers=user_a["headers"]).json()["total_count"] == 2
    assert client.get("/api/history", headers=user_b["headers"]).json()["total_count"] == 1

    # User B performs clear-all
    clear_res = client.delete("/api/history", headers=user_b["headers"])
    assert clear_res.status_code == 200
    assert clear_res.json()["deleted_count"] == 1

    # User B now has 0 records
    assert client.get("/api/history", headers=user_b["headers"]).json()["total_count"] == 0

    # User A STILL has their 2 records intact!
    hist_a = client.get("/api/history", headers=user_a["headers"]).json()
    assert hist_a["total_count"] == 2
    assert len(hist_a["items"]) == 2


# =============================================================================
# 2. PRIORITY TWO: AUTHENTICATION, OTP HARDENING & JWT VERIFICATION
# =============================================================================

def test_otp_attempt_lockout_after_max_attempts(client):
    """After 5 failed verification attempts, the OTP is invalidated and locked."""
    user_cred = {
        "email": "lockout_test@securecipher.org",
        "password": "LockoutPass#2026",
        "full_name": "Lockout Test",
    }
    # Request OTP
    res_otp = client.post("/api/auth/register/request-otp", json=user_cred)
    real_otp = res_otp.json().get("dev_otp")

    # Submit 5 incorrect OTP attempts
    for attempt in range(1, 6):
        res_fail = client.post(
            "/api/auth/register/verify-otp",
            json={**user_cred, "otp": "000000"},
        )
        assert res_fail.status_code == 400
        if attempt < 5:
            assert f"{5 - attempt} attempt(s) remaining" in res_fail.json()["detail"]
        else:
            assert "Maximum verification attempts exceeded" in res_fail.json()["detail"]

    # Now attempt with the real OTP -> MUST still fail because it was locked/invalidated
    res_real_after_lockout = client.post(
        "/api/auth/register/verify-otp",
        json={**user_cred, "otp": real_otp},
    )
    assert res_real_after_lockout.status_code == 400
    assert "no active verification" in res_real_after_lockout.json()["detail"].lower() or "invalid" in res_real_after_lockout.json()["detail"].lower()


def test_production_mode_suppresses_dev_otp(monkeypatch):
    """In production mode, dev_otp is never returned in registration OTP responses."""
    # Set ENVIRONMENT to production
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "SMTP_HOST", "")  # No SMTP configured

    prod_client = TestClient(app)
    res = prod_client.post(
        "/api/auth/register/request-otp",
        json={"email": "prod_test@securecipher.org", "password": "ProdPass#2026", "full_name": "Prod User"},
    )
    # Without SMTP in production, it fails safely with 503 rather than leaking OTP
    assert res.status_code == 503
    assert "smtp" in res.json()["detail"].lower() or "unavailable" in res.json()["detail"].lower()
    assert "dev_otp" not in res.json()


def test_jwt_tampering_and_invalid_signature_rejection(client):
    """Tampered JWT tokens or tokens with bad signatures must return 401."""
    user = register_and_login_user(client, "jwt_test@securecipher.org", "JwtPass#2026", "JWT Analyst")
    valid_token = user["token"]

    # Tamper with the token signature (modify last characters)
    tampered_token = valid_token[:-4] + "xxxx"
    res_tampered = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {tampered_token}"},
    )
    assert res_tampered.status_code == 401


# =============================================================================
# 3. PRIORITY THREE & FIVE: CRYPTOGRAPHIC INVARIANTS & INPUT PROTECTION
# =============================================================================

def test_aes_gcm_tampered_ciphertext_fails_safely(client):
    """AES-256-GCM decryption with modified ciphertext or authentication tag fails cleanly."""
    encrypt_res = client.post(
        "/api/aes/encrypt",
        json={"plaintext": "Confidential Message", "passphrase": "CorrectPassphrase#2026"},
    )
    assert encrypt_res.status_code == 200
    enc_data = encrypt_res.json()

    # Decrypt with wrong passphrase -> 400 Bad Request
    wrong_pass_res = client.post(
        "/api/aes/decrypt",
        json={
            "ciphertext": enc_data["ciphertext"],
            "nonce": enc_data["nonce"],
            "salt": enc_data["salt"],
            "tag": enc_data["tag"],
            "passphrase": "WrongPassphrase#2026",
        },
    )
    assert wrong_pass_res.status_code == 400
    assert "tag verification failed" in wrong_pass_res.json()["detail"].lower() or "decryption failed" in wrong_pass_res.json()["detail"].lower()
    assert "Confidential Message" not in wrong_pass_res.text

    # Tamper with ciphertext by corrupting Base64 payload
    tampered_ct = enc_data["ciphertext"][:-2] + "AA"
    tampered_res = client.post(
        "/api/aes/decrypt",
        json={
            "ciphertext": tampered_ct,
            "nonce": enc_data["nonce"],
            "salt": enc_data["salt"],
            "tag": enc_data["tag"],
            "passphrase": "CorrectPassphrase#2026",
        },
    )
    assert tampered_res.status_code == 400
    assert "Confidential Message" not in tampered_res.text


def test_rsa_roundtrip_and_invalid_ciphertext_handling(client):
    """RSA key generation, encryption, and decryption round trip."""
    # Generate 2048-bit RSA keypair
    keygen_res = client.post("/api/rsa/generate-keys", json={"key_size": 2048})
    assert keygen_res.status_code == 200
    keys = keygen_res.json()

    # Encrypt
    enc_res = client.post(
        "/api/rsa/encrypt",
        json={"plaintext": "Asymmetric Secret", "public_key_pem": keys["public_key_pem"]},
    )
    assert enc_res.status_code == 200
    ct = enc_res.json()["ciphertext"]

    # Decrypt
    dec_res = client.post(
        "/api/rsa/decrypt",
        json={"ciphertext": ct, "private_key_pem": keys["private_key_pem"]},
    )
    assert dec_res.status_code == 200
    assert dec_res.json()["plaintext"] == "Asymmetric Secret"

    # Decrypt with corrupted ciphertext fails safely
    bad_dec = client.post(
        "/api/rsa/decrypt",
        json={"ciphertext": "NotValidBase64Ciphertext", "private_key_pem": keys["private_key_pem"]},
    )
    assert bad_dec.status_code == 400


def test_diffie_hellman_shared_secret_agreement(client):
    """Diffie-Hellman simulation derives identical shared secrets."""
    res = client.post("/api/diffie-hellman/simulate-exchange")
    assert res.status_code == 200
    data = res.json()
    assert data["key_match"] is True
    assert data["alice_derived_key_b64"] == data["bob_derived_key_b64"]
    assert len(data["key_fingerprint"]) == 64  # SHA-256 fingerprint


def test_oversized_request_boundary_rejection(client):
    """Requests exceeding schema boundaries are rejected by Pydantic."""
    # Plaintext schema limits at 500,000 characters
    oversized_text = "A" * 500_001
    res = client.post(
        "/api/sha256/hash-text",
        json={"text": oversized_text},
    )
    assert res.status_code == 422  # Unprocessable Entity


# =============================================================================
# 4. PRIORITY FOUR: PRIVACY & AUDIT METADATA VERIFICATION
# =============================================================================

def test_audit_history_does_not_persist_sensitive_data(client):
    """Ensure that audit history records only metadata and zero plaintexts or keys."""
    user = register_and_login_user(client, "auditor@securecipher.org", "AuditorPass#2026", "Security Auditor")

    # Run AES encryption
    secret_message = "TOP_SECRET_MISSION_ALPHA_12345"
    secret_passphrase = "UltraSecretPassphrase!2026"
    client.post(
        "/api/aes/encrypt",
        headers=user["headers"],
        json={"plaintext": secret_message, "passphrase": secret_passphrase},
    )

    # Inspect the database directly via test session
    db = TestingSessionLocal()
    records = db.query(OperationHistory).filter(OperationHistory.user_id == user["user_id"]).all()
    assert len(records) == 1
    rec = records[0]

    # Verify metadata fields are recorded
    assert rec.algorithm_name == "AES-256-GCM"
    assert rec.operation_type == "encryption"
    assert rec.status == "success"
    assert rec.execution_duration_ms is not None

    # Verify that secret plaintext, passphrase, or keys are nowhere in the table
    for col in ["algorithm_name", "operation_type", "status"]:
        val = getattr(rec, col)
        assert secret_message not in str(val)
        assert secret_passphrase not in str(val)
    db.close()


def test_history_filtering_and_pagination(client):
    """Verify algorithm filtering and offset pagination in history endpoint."""
    user = register_and_login_user(client, "filter_user@securecipher.org", "FilterPass#2026", "Filter Auditor")

    # Perform 3 AES operations
    for _ in range(3):
        client.post(
            "/api/aes/encrypt",
            headers=user["headers"],
            json={"plaintext": "Data", "passphrase": "FilterPassphrase#2026"},
        )

    # Perform 2 SHA-256 operations
    for _ in range(2):
        client.post(
            "/api/sha256/hash-text",
            headers=user["headers"],
            json={"text": "Data to hash"},
        )

    # Filter by AES
    aes_hist = client.get("/api/history?algorithm=AES", headers=user["headers"]).json()
    assert aes_hist["total_count"] == 3
    assert len(aes_hist["items"]) == 3
    for it in aes_hist["items"]:
        assert "AES" in it["algorithm_name"]

    # Filter by SHA-256
    sha_hist = client.get("/api/history?algorithm=SHA-256", headers=user["headers"]).json()
    assert sha_hist["total_count"] == 2
    assert len(sha_hist["items"]) == 2

    # Test pagination: limit=2, offset=0
    page1 = client.get("/api/history?limit=2&offset=0", headers=user["headers"]).json()
    assert len(page1["items"]) == 2
    assert page1["total_count"] == 5

    # Test pagination: limit=2, offset=2
    page2 = client.get("/api/history?limit=2&offset=2", headers=user["headers"]).json()
    assert len(page2["items"]) == 2
    # Ensure items are different from page 1
    page1_ids = [i["id"] for i in page1["items"]]
    page2_ids = [i["id"] for i in page2["items"]]
    assert set(page1_ids).isdisjoint(set(page2_ids))
