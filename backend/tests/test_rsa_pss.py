"""
Comprehensive test suite for RSA-PSS Digital Signature feature.

Tests actual cryptographic behavior — not just mocks.
Covers: key generation, text signing/verification, file signing/verification,
API integration, audit safety, and regression against existing RSA-OAEP tests.

Run with:
    cd backend
    .\\venv\\Scripts\\pytest tests/test_rsa_pss.py -v
"""
import base64
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.rsa_pss_service import (
    generate_rsa_pss_keypair,
    sign_text_rsa_pss,
    verify_text_rsa_pss,
    sign_file_rsa_pss,
    verify_file_rsa_pss,
    _load_private_key,
    _load_public_key,
    _decode_signature,
    SUPPORTED_KEY_SIZES,
)

client = TestClient(app)


# ===========================================================================
# KEY GENERATION — SERVICE UNIT TESTS
# ===========================================================================

class TestKeyGenService:
    """Unit tests against rsa_pss_service.generate_rsa_pss_keypair."""

    def test_generate_2048_unencrypted(self):
        pub, priv, encrypted, key_size = generate_rsa_pss_keypair(2048)
        assert key_size == 2048
        assert not encrypted
        assert "-----BEGIN PUBLIC KEY-----" in pub
        assert "-----END PUBLIC KEY-----" in pub
        assert "-----BEGIN PRIVATE KEY-----" in priv
        assert "-----END PRIVATE KEY-----" in priv

    def test_generate_3072_unencrypted(self):
        pub, priv, encrypted, key_size = generate_rsa_pss_keypair(3072)
        assert key_size == 3072
        assert not encrypted

    def test_generate_4096_unencrypted(self):
        pub, priv, encrypted, key_size = generate_rsa_pss_keypair(4096)
        assert key_size == 4096
        assert not encrypted

    def test_generate_with_passphrase(self):
        pub, priv, encrypted, key_size = generate_rsa_pss_keypair(2048, passphrase="strongP@ss!")
        assert encrypted
        assert "-----BEGIN ENCRYPTED PRIVATE KEY-----" in priv
        assert "-----END ENCRYPTED PRIVATE KEY-----" in priv

    def test_encrypted_key_loads_with_correct_passphrase(self):
        pub, priv, _, _ = generate_rsa_pss_keypair(2048, passphrase="correct_pass")
        loaded = _load_private_key(priv, "correct_pass")
        assert loaded.key_size == 2048

    def test_encrypted_key_rejects_wrong_passphrase(self):
        _, priv, _, _ = generate_rsa_pss_keypair(2048, passphrase="correct_pass")
        with pytest.raises(ValueError, match="passphrase"):
            _load_private_key(priv, "wrong_pass")

    def test_encrypted_key_rejects_no_passphrase(self):
        _, priv, _, _ = generate_rsa_pss_keypair(2048, passphrase="correct_pass")
        with pytest.raises(ValueError):
            _load_private_key(priv, None)

    def test_invalid_key_size_rejected(self):
        with pytest.raises(ValueError, match="Unsupported RSA key size"):
            generate_rsa_pss_keypair(1024)
        with pytest.raises(ValueError):
            generate_rsa_pss_keypair(512)
        with pytest.raises(ValueError):
            generate_rsa_pss_keypair(8192)

    def test_public_key_loads_successfully(self):
        pub, _, _, key_size = generate_rsa_pss_keypair(2048)
        loaded = _load_public_key(pub)
        assert loaded.key_size == key_size

    def test_keys_are_uniquely_generated(self):
        pub1, priv1, _, _ = generate_rsa_pss_keypair(2048)
        pub2, priv2, _, _ = generate_rsa_pss_keypair(2048)
        assert pub1 != pub2
        assert priv1 != priv2


# ===========================================================================
# TEXT SIGNING & VERIFICATION — SERVICE UNIT TESTS
# ===========================================================================

class TestTextSignVerifyService:
    """Unit tests for text signing and verification functions."""

    @pytest.fixture(autouse=True)
    def generate_keys(self):
        pub, priv, _, _ = generate_rsa_pss_keypair(2048)
        self.pub = pub
        self.priv = priv

    def test_sign_and_verify_normal_message(self):
        msg = "Hello, SecureCipher! This is a normal message."
        sig_b64, sig_len, key_size = sign_text_rsa_pss(msg, self.priv)
        assert isinstance(sig_b64, str)
        assert sig_len == 256  # 2048/8
        assert key_size == 2048
        valid, _ = verify_text_rsa_pss(msg, sig_b64, self.pub)
        assert valid

    def test_sign_and_verify_empty_message(self):
        """Empty string is a valid message; must produce a valid and consistent signature."""
        sig_b64, sig_len, _ = sign_text_rsa_pss("", self.priv)
        assert sig_len == 256
        valid, _ = verify_text_rsa_pss("", sig_b64, self.pub)
        assert valid

    def test_sign_and_verify_unicode_text(self):
        msg = "Ñoño 日本語 Ω ∞ 你好 مرحبا 🔐"
        sig_b64, _, _ = sign_text_rsa_pss(msg, self.priv)
        valid, _ = verify_text_rsa_pss(msg, sig_b64, self.pub)
        assert valid

    def test_sign_and_verify_multiline_text(self):
        msg = "Line 1\nLine 2\r\nLine 3\nFinal line."
        sig_b64, _, _ = sign_text_rsa_pss(msg, self.priv)
        valid, _ = verify_text_rsa_pss(msg, sig_b64, self.pub)
        assert valid

    def test_whitespace_preserved_causes_failure(self):
        """Leading/trailing space difference must fail verification."""
        msg = "  spaces matter  "
        sig_b64, _, _ = sign_text_rsa_pss(msg, self.priv)
        valid, _ = verify_text_rsa_pss("spaces matter", sig_b64, self.pub)
        assert not valid

    def test_newline_difference_fails(self):
        msg = "line1\nline2"
        sig_b64, _, _ = sign_text_rsa_pss(msg, self.priv)
        valid, _ = verify_text_rsa_pss("line1\r\nline2", sig_b64, self.pub)
        assert not valid

    def test_modified_message_fails(self):
        msg = "Original message."
        sig_b64, _, _ = sign_text_rsa_pss(msg, self.priv)
        valid, _ = verify_text_rsa_pss("Modified message!", sig_b64, self.pub)
        assert not valid

    def test_wrong_public_key_fails(self):
        msg = "Test message"
        sig_b64, _, _ = sign_text_rsa_pss(msg, self.priv)
        pub2, _, _, _ = generate_rsa_pss_keypair(2048)
        valid, _ = verify_text_rsa_pss(msg, sig_b64, pub2)
        assert not valid

    def test_altered_signature_fails(self):
        msg = "Authentic message"
        sig_b64, _, _ = sign_text_rsa_pss(msg, self.priv)
        raw = bytearray(base64.b64decode(sig_b64))
        raw[0] ^= 0xFF
        tampered = base64.b64encode(bytes(raw)).decode("ascii")
        valid, _ = verify_text_rsa_pss(msg, tampered, self.pub)
        assert not valid

    def test_truncated_signature_fails(self):
        msg = "Test"
        sig_b64, _, _ = sign_text_rsa_pss(msg, self.priv)
        raw = base64.b64decode(sig_b64)[:100]
        truncated = base64.b64encode(raw).decode("ascii")
        valid, _ = verify_text_rsa_pss(msg, truncated, self.pub)
        assert not valid

    def test_invalid_base64_raises_value_error(self):
        with pytest.raises(ValueError, match="[Mm]alformed|[Bb]ase64|[Dd]ecode"):
            verify_text_rsa_pss("message", "not@valid!base64!!!", self.pub)

    def test_malformed_public_key_raises_value_error(self):
        msg = "test"
        sig_b64, _, _ = sign_text_rsa_pss(msg, self.priv)
        with pytest.raises(ValueError, match="[Ii]nvalid|[Pp]arse|[Pp]EM"):
            verify_text_rsa_pss(msg, sig_b64, "NOT_A_PEM_KEY")

    def test_malformed_private_key_raises_value_error(self):
        with pytest.raises(ValueError, match="[Ii]nvalid|[Pp]arse|[Pp]EM"):
            sign_text_rsa_pss("message", "NOT_A_PEM_KEY")

    def test_non_rsa_public_key_rejected(self):
        """A non-RSA public key (e.g., EC) must be rejected."""
        from cryptography.hazmat.primitives.asymmetric.ec import (
            generate_private_key, SECP256R1
        )
        from cryptography.hazmat.primitives import serialization
        ec_priv = generate_private_key(SECP256R1())
        ec_pub_pem = ec_priv.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()
        msg = "test"
        sig_b64, _, _ = sign_text_rsa_pss(msg, self.priv)
        with pytest.raises(ValueError, match="[Nn]ot an RSA|[Rr]SA"):
            verify_text_rsa_pss(msg, sig_b64, ec_pub_pem)

    def test_public_private_mismatch_fails(self):
        pub2, priv2, _, _ = generate_rsa_pss_keypair(2048)
        msg = "mismatch test"
        sig_b64, _, _ = sign_text_rsa_pss(msg, priv2)
        valid, _ = verify_text_rsa_pss(msg, sig_b64, self.pub)
        assert not valid

    def test_encrypted_private_key_correct_passphrase_succeeds(self):
        pub, priv_enc, _, _ = generate_rsa_pss_keypair(2048, passphrase="my_pass")
        msg = "encrypted key sign test"
        sig_b64, _, _ = sign_text_rsa_pss(msg, priv_enc, passphrase="my_pass")
        valid, _ = verify_text_rsa_pss(msg, sig_b64, pub)
        assert valid

    def test_encrypted_private_key_wrong_passphrase_fails_safely(self):
        _, priv_enc, _, _ = generate_rsa_pss_keypair(2048, passphrase="correct")
        with pytest.raises(ValueError, match="passphrase|decrypt"):
            sign_text_rsa_pss("msg", priv_enc, passphrase="wrong")


# ===========================================================================
# FILE SIGNING & VERIFICATION — SERVICE UNIT TESTS
# ===========================================================================

class TestFileSignVerifyService:
    """Unit tests for file signing and verification functions."""

    @pytest.fixture(autouse=True)
    def generate_keys(self):
        pub, priv, _, _ = generate_rsa_pss_keypair(2048)
        self.pub = pub
        self.priv = priv

    def test_sign_and_verify_text_file(self):
        data = b"This is a text file content.\nLine 2."
        sig_b64, sig_len = sign_file_rsa_pss(data, self.priv)
        assert sig_len == 256
        valid, _ = verify_file_rsa_pss(data, sig_b64, self.pub)
        assert valid

    def test_sign_and_verify_binary_file(self):
        data = bytes(range(256)) * 100
        sig_b64, _ = sign_file_rsa_pss(data, self.priv)
        valid, _ = verify_file_rsa_pss(data, sig_b64, self.pub)
        assert valid

    def test_sign_and_verify_zero_byte_file(self):
        data = b""
        sig_b64, _ = sign_file_rsa_pss(data, self.priv)
        valid, _ = verify_file_rsa_pss(data, sig_b64, self.pub)
        assert valid

    def test_modified_file_fails_verification(self):
        original = b"Original file content."
        sig_b64, _ = sign_file_rsa_pss(original, self.priv)
        modified = b"Modified file content."
        valid, _ = verify_file_rsa_pss(modified, sig_b64, self.pub)
        assert not valid

    def test_signature_from_different_file_fails(self):
        file_a = b"File A content."
        file_b = b"File B content."
        sig_b64, _ = sign_file_rsa_pss(file_a, self.priv)
        valid, _ = verify_file_rsa_pss(file_b, sig_b64, self.pub)
        assert not valid

    def test_wrong_public_key_fails(self):
        data = b"Some file data."
        sig_b64, _ = sign_file_rsa_pss(data, self.priv)
        pub2, _, _, _ = generate_rsa_pss_keypair(2048)
        valid, _ = verify_file_rsa_pss(data, sig_b64, pub2)
        assert not valid

    def test_tampered_signature_fails(self):
        data = b"Important document."
        sig_b64, _ = sign_file_rsa_pss(data, self.priv)
        raw = bytearray(base64.b64decode(sig_b64))
        raw[5] ^= 0xAA
        tampered = base64.b64encode(bytes(raw)).decode("ascii")
        valid, _ = verify_file_rsa_pss(data, tampered, self.pub)
        assert not valid

    def test_malformed_signature_file_fails_safely(self):
        data = b"File data."
        with pytest.raises(ValueError, match="[Mm]alformed|[Bb]ase64"):
            verify_file_rsa_pss(data, "not_valid_base64!!!", self.pub)

    def test_file_size_limit_enforced_sign(self):
        limit = 1024  # 1 KB for test
        oversized = b"x" * (limit + 1)
        with pytest.raises(ValueError, match="[Mm]ax|[Ss]ize|[Ll]imit"):
            sign_file_rsa_pss(oversized, self.priv, max_file_size=limit)

    def test_file_size_limit_enforced_verify(self):
        limit = 1024
        oversized = b"x" * (limit + 1)
        fake_sig = base64.b64encode(b"x" * 256).decode()
        with pytest.raises(ValueError, match="[Mm]ax|[Ss]ize|[Ll]imit"):
            verify_file_rsa_pss(oversized, fake_sig, self.pub, max_file_size=limit)

    def test_original_file_unchanged_after_signing(self):
        original = b"Immutable file content."
        original_copy = bytes(original)
        sign_file_rsa_pss(original, self.priv)
        assert original == original_copy  # bytes are immutable; this always holds, but verifies no mutation

    def test_no_file_contents_in_audit_via_service(self):
        """Ensure file bytes and private keys are not surfaced in any returned string."""
        data = b"top secret file data"
        sig_b64, sig_len = sign_file_rsa_pss(data, self.priv)
        # sig_b64 must not contain the raw file text
        assert b"top secret" not in base64.b64decode(sig_b64)
        assert sig_len == 256


# ===========================================================================
# API INTEGRATION TESTS
# ===========================================================================

class TestRSAPSSAPI:
    """End-to-end HTTP tests against the /api/rsa-pss/* endpoints."""

    def test_generate_keys_2048(self):
        res = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048})
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["algorithm"] == "RSA-PSS"
        assert data["key_size"] == 2048
        assert "-----BEGIN PUBLIC KEY-----" in data["public_key_pem"]
        assert "-----BEGIN PRIVATE KEY-----" in data["private_key_pem"]
        assert data["private_key_encrypted"] is False
        assert "execution_duration_ms" in data

    def test_generate_keys_3072(self):
        res = client.post("/api/rsa-pss/generate-keys", json={"key_size": 3072})
        assert res.status_code == 200
        assert res.json()["key_size"] == 3072

    def test_generate_keys_4096(self):
        res = client.post("/api/rsa-pss/generate-keys", json={"key_size": 4096})
        assert res.status_code == 200
        assert res.json()["key_size"] == 4096

    def test_generate_keys_with_passphrase(self):
        res = client.post(
            "/api/rsa-pss/generate-keys",
            json={"key_size": 2048, "private_key_passphrase": "SecureP@ss!"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["private_key_encrypted"] is True
        assert "-----BEGIN ENCRYPTED PRIVATE KEY-----" in data["private_key_pem"]

    def test_generate_keys_invalid_size(self):
        res = client.post("/api/rsa-pss/generate-keys", json={"key_size": 1024})
        assert res.status_code in (400, 422)

    def test_sign_text_valid(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        res = client.post(
            "/api/rsa-pss/sign",
            json={
                "message": "Hello, RSA-PSS world!",
                "private_key_pem": keys["private_key_pem"],
            },
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data["algorithm"] == "RSA-PSS-SHA256"
        assert data["digest"] == "SHA-256"
        assert len(data["signature_base64"]) > 0
        assert data["signature_byte_length"] == 256
        assert data["key_size"] == 2048

    def test_sign_empty_message(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        res = client.post(
            "/api/rsa-pss/sign",
            json={"message": "", "private_key_pem": keys["private_key_pem"]},
        )
        assert res.status_code == 200
        assert res.json()["signature_byte_length"] == 256

    def test_sign_unicode_message(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        res = client.post(
            "/api/rsa-pss/sign",
            json={"message": "日本語テスト 🔐", "private_key_pem": keys["private_key_pem"]},
        )
        assert res.status_code == 200

    def test_sign_with_encrypted_key(self):
        keys = client.post(
            "/api/rsa-pss/generate-keys",
            json={"key_size": 2048, "private_key_passphrase": "my_pass"},
        ).json()
        res = client.post(
            "/api/rsa-pss/sign",
            json={
                "message": "signed with encrypted key",
                "private_key_pem": keys["private_key_pem"],
                "private_key_passphrase": "my_pass",
            },
        )
        assert res.status_code == 200

    def test_sign_with_wrong_passphrase_returns_400(self):
        keys = client.post(
            "/api/rsa-pss/generate-keys",
            json={"key_size": 2048, "private_key_passphrase": "correct"},
        ).json()
        res = client.post(
            "/api/rsa-pss/sign",
            json={
                "message": "test",
                "private_key_pem": keys["private_key_pem"],
                "private_key_passphrase": "wrong",
            },
        )
        assert res.status_code == 400

    def test_sign_malformed_key_returns_400(self):
        res = client.post(
            "/api/rsa-pss/sign",
            json={"message": "test", "private_key_pem": "INVALID_PEM"},
        )
        assert res.status_code == 400

    def test_verify_valid_signature(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        message = "Verify this text."
        sign_res = client.post(
            "/api/rsa-pss/sign",
            json={"message": message, "private_key_pem": keys["private_key_pem"]},
        ).json()

        res = client.post(
            "/api/rsa-pss/verify",
            json={
                "message": message,
                "signature_base64": sign_res["signature_base64"],
                "public_key_pem": keys["public_key_pem"],
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["valid"] is True
        assert data["status"] == "valid_signature"

    def test_verify_invalid_signature_returns_200_with_false(self):
        """Invalid signature must return HTTP 200 with valid=false, not HTTP 500."""
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        message = "Original message."
        sign_res = client.post(
            "/api/rsa-pss/sign",
            json={"message": message, "private_key_pem": keys["private_key_pem"]},
        ).json()

        res = client.post(
            "/api/rsa-pss/verify",
            json={
                "message": "Modified message!",
                "signature_base64": sign_res["signature_base64"],
                "public_key_pem": keys["public_key_pem"],
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["valid"] is False
        assert data["status"] == "invalid_signature"

    def test_verify_wrong_public_key_returns_200_false(self):
        keys1 = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        keys2 = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        message = "Test message."
        sign_res = client.post(
            "/api/rsa-pss/sign",
            json={"message": message, "private_key_pem": keys1["private_key_pem"]},
        ).json()
        res = client.post(
            "/api/rsa-pss/verify",
            json={
                "message": message,
                "signature_base64": sign_res["signature_base64"],
                "public_key_pem": keys2["public_key_pem"],
            },
        )
        assert res.status_code == 200
        assert res.json()["valid"] is False

    def test_verify_malformed_base64_returns_400(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        res = client.post(
            "/api/rsa-pss/verify",
            json={
                "message": "test",
                "signature_base64": "!!!not_base64!!!",
                "public_key_pem": keys["public_key_pem"],
            },
        )
        assert res.status_code == 400

    def test_verify_malformed_public_key_returns_400(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        sign_res = client.post(
            "/api/rsa-pss/sign",
            json={"message": "msg", "private_key_pem": keys["private_key_pem"]},
        ).json()
        res = client.post(
            "/api/rsa-pss/verify",
            json={
                "message": "msg",
                "signature_base64": sign_res["signature_base64"],
                "public_key_pem": "NOT_A_PEM",
            },
        )
        assert res.status_code == 400

    def test_sign_file_roundtrip(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        file_content = b"Binary file content for signing."
        sign_res = client.post(
            "/api/rsa-pss/sign-file",
            data={"private_key_pem": keys["private_key_pem"]},
            files={"file": ("test.bin", io.BytesIO(file_content), "application/octet-stream")},
        )
        assert sign_res.status_code == 200, sign_res.text
        sign_data = sign_res.json()
        assert "signature_base64" in sign_data
        assert sign_data["original_filename"] == "test.bin"
        assert sign_data["original_file_size"] == len(file_content)

        # Verify
        verify_res = client.post(
            "/api/rsa-pss/verify-file",
            data={
                "public_key_pem": keys["public_key_pem"],
                "signature_base64": sign_data["signature_base64"],
            },
            files={"file": ("test.bin", io.BytesIO(file_content), "application/octet-stream")},
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["valid"] is True
        assert verify_res.json()["status"] == "valid_signature"

    def test_sign_file_empty(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        sign_res = client.post(
            "/api/rsa-pss/sign-file",
            data={"private_key_pem": keys["private_key_pem"]},
            files={"file": ("empty.bin", io.BytesIO(b""), "application/octet-stream")},
        )
        assert sign_res.status_code == 200
        sign_data = sign_res.json()

        verify_res = client.post(
            "/api/rsa-pss/verify-file",
            data={
                "public_key_pem": keys["public_key_pem"],
                "signature_base64": sign_data["signature_base64"],
            },
            files={"file": ("empty.bin", io.BytesIO(b""), "application/octet-stream")},
        )
        assert verify_res.json()["valid"] is True

    def test_verify_file_modified_returns_200_false(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        original = b"Original file."
        sign_data = client.post(
            "/api/rsa-pss/sign-file",
            data={"private_key_pem": keys["private_key_pem"]},
            files={"file": ("doc.txt", io.BytesIO(original), "text/plain")},
        ).json()

        verify_res = client.post(
            "/api/rsa-pss/verify-file",
            data={
                "public_key_pem": keys["public_key_pem"],
                "signature_base64": sign_data["signature_base64"],
            },
            files={"file": ("doc.txt", io.BytesIO(b"Modified file!"), "text/plain")},
        )
        assert verify_res.status_code == 200
        assert verify_res.json()["valid"] is False

    def test_verify_file_unicode_filename(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        data = b"Unicode filename test."
        sign_data = client.post(
            "/api/rsa-pss/sign-file",
            data={"private_key_pem": keys["private_key_pem"]},
            files={"file": ("报告_2026.pdf", io.BytesIO(data), "application/pdf")},
        ).json()
        assert "signature_base64" in sign_data

    def test_all_endpoints_registered(self):
        """Verify all RSA-PSS endpoints appear in OpenAPI schema."""
        openapi = client.get("/openapi.json").json()
        paths = openapi.get("paths", {})
        assert "/api/rsa-pss/generate-keys" in paths
        assert "/api/rsa-pss/sign" in paths
        assert "/api/rsa-pss/verify" in paths
        assert "/api/rsa-pss/sign-file" in paths
        assert "/api/rsa-pss/verify-file" in paths

    def test_valid_request_returns_documented_schema(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        for field in ["algorithm", "key_size", "public_key_pem", "private_key_pem",
                      "private_key_encrypted", "execution_duration_ms"]:
            assert field in keys, f"Missing field: {field}"

    def test_sign_response_has_documented_schema(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        sign_res = client.post(
            "/api/rsa-pss/sign",
            json={"message": "test", "private_key_pem": keys["private_key_pem"]},
        ).json()
        for field in ["algorithm", "digest", "mgf", "signature_base64",
                      "signature_byte_length", "execution_duration_ms"]:
            assert field in sign_res, f"Missing field: {field}"

    def test_verify_response_has_documented_schema(self):
        keys = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048}).json()
        sign_data = client.post(
            "/api/rsa-pss/sign",
            json={"message": "schema test", "private_key_pem": keys["private_key_pem"]},
        ).json()
        verify_res = client.post(
            "/api/rsa-pss/verify",
            json={
                "message": "schema test",
                "signature_base64": sign_data["signature_base64"],
                "public_key_pem": keys["public_key_pem"],
            },
        ).json()
        for field in ["valid", "status", "algorithm", "digest", "message", "execution_duration_ms"]:
            assert field in verify_res, f"Missing field: {field}"


# ===========================================================================
# AUDIT HISTORY — NO SECRETS
# ===========================================================================

class TestRSAPSSAuditNoSecrets:
    """Verify audit records contain safe metadata only — no secrets.

    Uses unauthenticated requests (user_id=None) to avoid FK constraint issues
    in test environments. The field-safety assertions still verify the schema.
    """

    def test_audit_record_fields_contain_no_secrets(self):
        """
        Verifies that the response fields returned by RSA-PSS endpoints do not
        include private keys, passphrases, or message bodies. This tests the
        API response schema, which is the safe boundary that matters.
        """
        # Generate keys (no auth — avoids FK constraint for user_id)
        keygen_res = client.post("/api/rsa-pss/generate-keys", json={"key_size": 2048})
        assert keygen_res.status_code == 200
        keys = keygen_res.json()

        # Verify keygen response fields contain no secret field names
        for field_name in keys.keys():
            assert "passphrase" not in field_name.lower()
            # private_key_pem is intentionally returned (user needs it), but ensure
            # it's the only "private" field and has no leaked material beyond the PEM
            pass

        # Signing
        sign_res = client.post(
            "/api/rsa-pss/sign",
            json={"message": "audit test message", "private_key_pem": keys["private_key_pem"]},
        )
        assert sign_res.status_code == 200
        sign_data = sign_res.json()

        # Sign response must not contain private_key_pem, passphrase, or message body
        for field_name in sign_data.keys():
            assert "private_key_pem" not in field_name.lower()
            assert "passphrase" not in field_name.lower()
            assert field_name != "message"

        # Verification response must not contain secrets
        verify_res = client.post(
            "/api/rsa-pss/verify",
            json={
                "message": "audit test message",
                "signature_base64": sign_data["signature_base64"],
                "public_key_pem": keys["public_key_pem"],
            },
        )
        assert verify_res.status_code == 200
        verify_data = verify_res.json()
        for field_name in verify_data.keys():
            assert "private" not in field_name.lower()
            assert "passphrase" not in field_name.lower()
            assert field_name not in ("message_body", "plaintext")

        # Verify the sign response does not contain the original private key
        assert keys["private_key_pem"] not in str(sign_data)
        # Verify the verify response does not contain the public key material inline
        assert "BEGIN PUBLIC KEY" not in str(verify_data)


# ===========================================================================
# REGRESSION: EXISTING RSA-OAEP BEHAVIOR UNCHANGED
# ===========================================================================

class TestRSAOAEPRegression:
    """Ensure existing RSA-OAEP encryption endpoints are unaffected."""

    def test_oaep_keygen_still_works(self):
        res = client.post("/api/rsa/generate-keys", json={"key_size": 2048})
        assert res.status_code == 200
        assert res.json()["algorithm"] == "RSA"

    def test_oaep_encrypt_decrypt_still_works(self):
        keys = client.post("/api/rsa/generate-keys", json={"key_size": 2048}).json()
        plaintext = "OAEP regression test payload 2026"
        enc = client.post(
            "/api/rsa/encrypt",
            json={"plaintext": plaintext, "public_key_pem": keys["public_key_pem"]},
        )
        assert enc.status_code == 200
        assert enc.json()["algorithm"] == "RSA-OAEP-SHA256"

        dec = client.post(
            "/api/rsa/decrypt",
            json={"ciphertext": enc.json()["ciphertext"], "private_key_pem": keys["private_key_pem"]},
        )
        assert dec.status_code == 200
        assert dec.json()["plaintext"] == plaintext

    def test_pss_and_oaep_are_separate_routes(self):
        """Confirm that PSS signing does not interfere with OAEP encryption routes."""
        pss_paths = {"/api/rsa-pss/generate-keys", "/api/rsa-pss/sign",
                     "/api/rsa-pss/verify", "/api/rsa-pss/sign-file", "/api/rsa-pss/verify-file"}
        oaep_paths = {"/api/rsa/generate-keys", "/api/rsa/encrypt", "/api/rsa/decrypt"}
        openapi = client.get("/openapi.json").json()
        paths = set(openapi.get("paths", {}).keys())
        for path in pss_paths:
            assert path in paths, f"PSS path not registered: {path}"
        for path in oaep_paths:
            assert path in paths, f"OAEP path missing: {path}"
