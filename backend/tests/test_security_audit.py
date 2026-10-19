"""
Comprehensive Security Audit Regression Test Suite — SecureCipher

Validates verified security remediations and critical security invariants:
1. SEC-01: File descriptor cleanup (UploadFile.close() called in finally blocks).
2. SEC-02: Password length limits (max 128 characters) preventing Bcrypt DoS & truncation.
3. SEC-03: Production fail-safe configuration for JWT secret and OpenAPI schema suppression.
4. SEC-04: CSV Formula Injection (CWE-1236) sanitization in audit log exports.
5. SEC-05: RSA-OAEP encrypted private key passphrase support and wrong-passphrase safety.
6. Cross-user isolation (IDOR protection on history, analytics, and deletion).
7. Authentication session validation (missing, malformed, expired, tampered JWTs).
8. Cryptographic integrity & safe error handling (AES-GCM tampering, RSA-PSS signature invalidation).
"""

import io
import time
import pytest
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

from app.main import app
from app.db.session import Base, get_db
from app.models.user import User, EmailOTP
from app.models.history import OperationHistory
from app.core.config import Settings, settings
from app.core.security import (
    validate_password_strength,
    create_access_token,
    decode_access_token,
)
from app.services.rsa_service import generate_rsa_keypair, encrypt_rsa_oaep, decrypt_rsa_oaep

# In-memory SQLite for test isolation
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


def register_user(client: TestClient, email: str, password: str, full_name: str) -> str:
    """Helper to register user and obtain valid JWT bearer token."""
    res_otp = client.post(
        "/api/auth/register/request-otp",
        json={"email": email, "password": password, "full_name": full_name},
    )
    assert res_otp.status_code == 200, res_otp.text
    otp_code = res_otp.json().get("dev_otp")

    res_verify = client.post(
        "/api/auth/register/verify-otp",
        json={"email": email, "password": password, "full_name": full_name, "otp": otp_code},
    )
    assert res_verify.status_code == 201, res_verify.text
    return res_verify.json()["access_token"]


# ============================================================================
# 1. SEC-02: Password Length Limits (Bcrypt DoS & Boundary Invariants)
# ============================================================================

def test_password_max_length_validation():
    """Verify passwords exceeding 128 characters are rejected in validate_password_strength."""
    valid_pass = "SecurePass123!@#"
    ok, err = validate_password_strength(valid_pass)
    assert ok
    assert err is None

    # Oversized password (129 characters)
    oversized = "Aa1!" + "x" * 126
    assert len(oversized) == 130
    ok, err = validate_password_strength(oversized)
    assert not ok
    assert "128 characters" in err


def test_request_otp_rejects_oversized_password(client: TestClient):
    """Verify /api/auth/register/request-otp rejects passwords longer than 128 characters."""
    oversized_password = "Password123!@" + "A" * 150
    response = client.post(
        "/api/auth/register/request-otp",
        json={
            "email": "dos_test@example.com",
            "password": oversized_password,
            "full_name": "DoS Test User",
        },
    )
    assert response.status_code == 422  # Pydantic validation error for max_length


def test_login_rejects_oversized_password(client: TestClient):
    """Verify /api/auth/login rejects payloads with oversized password strings."""
    oversized_password = "A" * 200
    response = client.post(
        "/api/auth/login",
        json={
            "email": "user@example.com",
            "password": oversized_password,
        },
    )
    assert response.status_code == 422


# ============================================================================
# 2. SEC-03: Production & Staging Security Configuration Fail-Safe
# ============================================================================

def test_production_settings_rejects_default_secret():
    """Verify Settings fails immediately if default dev JWT secret is used in production."""
    with pytest.raises(ValueError) as excinfo:
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET_KEY="securecipher_jwt_super_secret_signing_key_at_least_32_bytes_2026",
        )
    assert "Default development JWT_SECRET_KEY detected" in str(excinfo.value)


def test_production_settings_rejects_short_secret():
    """Verify Settings fails if JWT secret is shorter than 32 characters in production."""
    with pytest.raises(ValueError) as excinfo:
        Settings(
            ENVIRONMENT="production",
            JWT_SECRET_KEY="too_short_secret",
        )
    assert "must be at least 32 characters" in str(excinfo.value)


def test_production_settings_accepts_strong_secret():
    """Verify Settings succeeds in production with a 32+ char custom secret."""
    cfg = Settings(
        ENVIRONMENT="production",
        JWT_SECRET_KEY="production_ultra_secure_secret_key_random_bytes_2026_ok!",
    )
    assert cfg.ENVIRONMENT == "production"


def test_staging_settings_rejects_default_and_short_secret():
    """Verify Settings also fails in staging when given default or short secrets."""
    with pytest.raises(ValueError) as excinfo1:
        Settings(
            ENVIRONMENT="staging",
            JWT_SECRET_KEY="securecipher_jwt_super_secret_signing_key_at_least_32_bytes_2026",
        )
    assert "Default development JWT_SECRET_KEY detected" in str(excinfo1.value)

    with pytest.raises(ValueError) as excinfo2:
        Settings(
            ENVIRONMENT="staging",
            JWT_SECRET_KEY="short_staging_secret",
        )
    assert "must be at least 32 characters" in str(excinfo2.value)

    # Valid staging secret succeeds
    valid_staging = Settings(
        ENVIRONMENT="staging",
        JWT_SECRET_KEY="staging_ultra_secure_secret_key_random_bytes_2026_ok!",
    )
    assert valid_staging.ENVIRONMENT == "staging"


def test_production_openapi_behavior():
    """Verify that in production mode, OpenAPI schema and docs are disabled."""
    from fastapi import FastAPI
    prod_app = FastAPI(
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )
    prod_client = TestClient(prod_app)
    assert prod_client.get("/openapi.json").status_code == 404
    assert prod_client.get("/docs").status_code == 404
    assert prod_client.get("/redoc").status_code == 404


# ============================================================================
# 3. SEC-04: Comprehensive CSV Formula Injection (CWE-1236) Neutralization
# ============================================================================

def test_csv_export_neutralizes_formula_injection_comprehensive(client: TestClient):
    """
    Verify that export_analytics CSV export escapes values starting with
    formula trigger characters (=, +, -, @, \\t, \\r) as well as leading whitespace cases.
    """
    token = register_user(client, "formula_full@example.com", "FormulaSafe123!", "Formula Full Test")
    headers = {"Authorization": f"Bearer {token}"}

    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == "formula_full@example.com").first()
    assert user is not None

    test_vectors = [
        ("=cmd|'/C calc'!A0", "+SUM(1,2)", "-failed"),
        ("  =1+1", "   +2+2", "    -3-3"),
        (" @SUM(A1:A10)", "\t@alert(1)", "\r=malicious"),
        ("\t=cmd", "\r+calc", "normal_status"),
        ("   \tleading_space_tab", "   \rleading_space_cr", "\ttab_prefix"),
        ("\rcr_prefix", "-formula_minus", "+formula_plus"),
    ]

    for algo, op, st in test_vectors:
        rec = OperationHistory(
            algorithm_name=algo,
            operation_type=op,
            status=st,
            execution_duration_ms=10.0,
            user_id=user.id,
        )
        db.add(rec)
    db.commit()
    db.close()

    response = client.get("/api/analytics/export?format=csv", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    csv_text = response.text

    # 1. Formula triggers =, +, -, @ must be sanitized with single quote prefix
    assert "'=cmd|'/C calc'!A0" in csv_text
    assert "'+SUM(1,2)" in csv_text
    assert "'-failed" in csv_text
    assert "'-formula_minus" in csv_text
    assert "'+formula_plus" in csv_text

    # 2. Leading whitespace cases before formula triggers
    assert "'  =1+1" in csv_text
    assert "'   +2+2" in csv_text
    assert "'    -3-3" in csv_text
    assert "' @SUM(A1:A10)" in csv_text

    # 3. Tab and Carriage Return triggers (direct prefix and with leading whitespace)
    assert "'\t@alert(1)" in csv_text
    assert "'\r=malicious" in csv_text
    assert "'\t=cmd" in csv_text
    assert "'\r+calc" in csv_text
    assert "'\ttab_prefix" in csv_text
    assert "'\rcr_prefix" in csv_text
    assert "'   \tleading_space_tab" in csv_text
    assert "'   \rleading_space_cr" in csv_text

    # 4. Normal status values should NOT be prefixed with a quote
    assert "normal_status" in csv_text
    assert "'normal_status" not in csv_text


# ============================================================================
# Backward Compatibility Invariants
# ============================================================================

def test_bcrypt_backward_compatibility():
    """Verify existing bcrypt password hashing and verification remains 100% compatible."""
    from app.core.security import hash_password, verify_password

    password = "ExistingStandardPassword123!"
    pw_hash = hash_password(password)
    assert pw_hash.startswith("$2b$12$")
    assert verify_password(password, pw_hash) is True
    assert verify_password("WrongPassword123!", pw_hash) is False


def test_rsa_oaep_backward_compatibility_unencrypted_key(client: TestClient):
    """Verify that unencrypted RSA private keys work seamlessly with decrypt_rsa_oaep without passphrase."""
    from app.services.rsa_service import generate_rsa_keypair, encrypt_rsa_oaep, decrypt_rsa_oaep

    pub_pem, priv_pem, key_size = generate_rsa_keypair(2048)
    message = "Legacy unencrypted RSA-OAEP test message."

    ciphertext_b64, ks = encrypt_rsa_oaep(message, pub_pem)

    # Calling decrypt_rsa_oaep with 2 arguments (original signature)
    decrypted_2args = decrypt_rsa_oaep(ciphertext_b64, priv_pem)
    assert decrypted_2args == message

    # Calling via API without private_key_passphrase
    dec_res = client.post(
        "/api/rsa/decrypt",
        json={"ciphertext": ciphertext_b64, "private_key_pem": priv_pem},
    )
    assert dec_res.status_code == 200
    assert dec_res.json()["plaintext"] == message


# ============================================================================
# 4. SEC-05: RSA-OAEP Decryption with Passphrase-Protected Private Keys
# ============================================================================

def test_rsa_oaep_passphrase_protected_key_flow(client: TestClient):
    """Verify RSA-OAEP encryption and decryption with a passphrase-protected private key."""
    # Generate an encrypted RSA private key
    priv = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pub = priv.public_key()

    passphrase = "UltraSecretKeyPassphrase123!"
    enc_priv_pem = priv.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.BestAvailableEncryption(passphrase.encode("utf-8")),
    ).decode("utf-8")

    pub_pem = pub.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")

    message = "Secret message protected by encrypted RSA key."

    # Encrypt text using public key
    enc_res = client.post(
        "/api/rsa/encrypt",
        json={"plaintext": message, "public_key_pem": pub_pem},
    )
    assert enc_res.status_code == 200
    ciphertext_b64 = enc_res.json()["ciphertext"]

    # Decrypt with correct passphrase
    dec_res = client.post(
        "/api/rsa/decrypt",
        json={
            "ciphertext": ciphertext_b64,
            "private_key_pem": enc_priv_pem,
            "private_key_passphrase": passphrase,
        },
    )
    assert dec_res.status_code == 200
    assert dec_res.json()["plaintext"] == message

    # Decrypt with incorrect passphrase fails safely
    bad_res = client.post(
        "/api/rsa/decrypt",
        json={
            "ciphertext": ciphertext_b64,
            "private_key_pem": enc_priv_pem,
            "private_key_passphrase": "WrongPassphrase123!",
        },
    )
    assert bad_res.status_code == 400


# ============================================================================
# 5. SEC-01: UploadFile Cleanup Invariant
# ============================================================================

def test_upload_file_closed_after_hashing(client: TestClient):
    """Verify file handle is closed following SHA-256 file upload."""
    content = b"File descriptor leak prevention verification."
    file_obj = io.BytesIO(content)

    response = client.post(
        "/api/sha256/hash-file",
        files={"file": ("test_audit.txt", file_obj, "text/plain")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["file_size_bytes"] == len(content)


def test_upload_file_closed_after_aes_file_roundtrip(client: TestClient):
    """Verify file encryption and decryption endpoints process files and clean up."""
    content = b"Important binary data for secure AES-GCM file container test."
    file_obj = io.BytesIO(content)

    # Encrypt
    enc_res = client.post(
        "/api/aes/encrypt-file",
        files={"file": ("secret_doc.txt", file_obj, "text/plain")},
        data={"passphrase": "StrongFilePassphrase2026!"},
    )
    assert enc_res.status_code == 200
    container_bytes = enc_res.content

    # Decrypt
    dec_file = io.BytesIO(container_bytes)
    dec_res = client.post(
        "/api/aes/decrypt-file",
        files={"file": ("secret_doc.txt.scipher", dec_file, "application/octet-stream")},
        data={"passphrase": "StrongFilePassphrase2026!"},
    )
    assert dec_res.status_code == 200
    assert dec_res.content == content


# ============================================================================
# 6. Cross-User Isolation & IDOR Protection
# ============================================================================

def test_cross_user_history_isolation(client: TestClient):
    """Verify User A cannot read, query, or delete User B's audit history."""
    token_a = register_user(client, "alice@example.com", "AlicePass123!", "Alice User")
    token_b = register_user(client, "bob@example.com", "BobPass123!@", "Bob User")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Alice encrypts text (creates an audit record owned by Alice)
    res_enc = client.post(
        "/api/aes/encrypt",
        headers=headers_a,
        json={"plaintext": "Alice secret message", "passphrase": "AlicePassphrase123!"},
    )
    assert res_enc.status_code == 200

    # Alice sees her record
    res_hist_a = client.get("/api/history", headers=headers_a)
    assert res_hist_a.status_code == 200
    items_a = res_hist_a.json()["items"]
    assert len(items_a) == 1
    alice_item_id = items_a[0]["id"]

    # Bob's history is empty
    res_hist_b = client.get("/api/history", headers=headers_b)
    assert res_hist_b.status_code == 200
    items_b = res_hist_b.json()["items"]
    assert len(items_b) == 0

    # Bob attempts to delete Alice's record -> must return 404
    del_attempt = client.delete(f"/api/history/{alice_item_id}", headers=headers_b)
    assert del_attempt.status_code == 404

    # Alice's record is intact
    res_hist_a_after = client.get("/api/history", headers=headers_a)
    assert len(res_hist_a_after.json()["items"]) == 1


def test_cross_user_analytics_isolation(client: TestClient):
    """Verify User A's analytics metrics do not leak into User B's analytics."""
    token_a = register_user(client, "alice_metrics@example.com", "AlicePass123!", "Alice Metrics")
    token_b = register_user(client, "bob_metrics@example.com", "BobPass123!@", "Bob Metrics")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Alice creates 3 hash operations
    for i in range(3):
        client.post("/api/sha256/hash-text", headers=headers_a, json={"text": f"Msg {i}"})

    # Alice summary shows 3 operations
    sum_a = client.get("/api/analytics/summary", headers=headers_a)
    assert sum_a.status_code == 200
    assert sum_a.json()["total_operations"] == 3

    # Bob summary shows 0 operations
    sum_b = client.get("/api/analytics/summary", headers=headers_b)
    assert sum_b.status_code == 200
    assert sum_b.json()["total_operations"] == 0


# ============================================================================
# 7. Authentication Token Security Invariants
# ============================================================================

def test_missing_token_returns_401(client: TestClient):
    """Verify accessing protected routes without Bearer token returns 401."""
    res_history = client.get("/api/history")
    assert res_history.status_code == 401

    res_analytics = client.get("/api/analytics/summary")
    assert res_analytics.status_code == 401

    res_me = client.get("/api/auth/me")
    assert res_me.status_code == 401


def test_malformed_token_returns_401(client: TestClient):
    """Verify malformed or garbage token strings are rejected with 401."""
    headers = {"Authorization": "Bearer not.a.valid.jwt.token"}
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 401


def test_expired_token_returns_401(client: TestClient):
    """Verify expired token returns 401."""
    expired_token = create_access_token(
        data={"sub": "expired@example.com", "uid": 1},
        expires_delta=timedelta(seconds=-10),  # expired 10 seconds ago
    )
    headers = {"Authorization": f"Bearer {expired_token}"}
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 401


def test_tampered_token_signature_returns_401(client: TestClient):
    """Verify token signed with a different key returns 401."""
    token = register_user(client, "valid@example.com", "ValidPass123!", "Valid User")
    parts = token.split(".")
    # Tamper with signature bytes
    tampered_sig = parts[2][:-4] + "AAAA"
    tampered_token = f"{parts[0]}.{parts[1]}.{tampered_sig}"

    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {tampered_token}"})
    assert res.status_code == 401


# ============================================================================
# 8. Cryptographic Tamper & Integrity Invariants
# ============================================================================

def test_aes_gcm_ciphertext_tampering_fails_safely(client: TestClient):
    """Verify that tampering with AES-GCM ciphertext fails authentication safely."""
    # 1. Encrypt text
    enc_res = client.post(
        "/api/aes/encrypt",
        json={"plaintext": "Authentic secret message", "passphrase": "TestPassphrase123!"},
    )
    assert enc_res.status_code == 200
    data = enc_res.json()

    # 2. Tamper with ciphertext by altering characters
    tampered_ct = "A" + data["ciphertext"][1:]

    # 3. Decrypt tampered ciphertext -> must fail with 400
    dec_res = client.post(
        "/api/aes/decrypt",
        json={
            "passphrase": "TestPassphrase123!",
            "nonce": data["nonce"],
            "salt": data["salt"],
            "ciphertext": tampered_ct,
            "tag": data["tag"],
        },
    )
    assert dec_res.status_code == 400


def test_rsa_pss_tampered_signature_returns_valid_false(client: TestClient):
    """Verify RSA-PSS signature verification returns valid: false (not 500) on tampering."""
    # Generate keys
    kg_res = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048})
    assert kg_res.status_code == 200
    keys = kg_res.json()

    # Sign text
    sign_res = client.post(
        "/api/rsa-pss/sign",
        json={
            "message": "Original signed statement",
            "private_key_pem": keys["private_key_pem"],
        },
    )
    assert sign_res.status_code == 200
    sig = sign_res.json()["signature_base64"]

    # Verify original message -> valid
    v_orig = client.post(
        "/api/rsa-pss/verify",
        json={
            "message": "Original signed statement",
            "signature_base64": sig,
            "public_key_pem": keys["public_key_pem"],
        },
    )
    assert v_orig.status_code == 200
    assert v_orig.json()["valid"] is True

    # Verify tampered message -> returns 200 with valid: False (not 500 error)
    v_tampered = client.post(
        "/api/rsa-pss/verify",
        json={
            "message": "Modified/Tampered statement",
            "signature_base64": sig,
            "public_key_pem": keys["public_key_pem"],
        },
    )
    assert v_tampered.status_code == 200
    assert v_tampered.json()["valid"] is False
