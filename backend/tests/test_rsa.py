import base64
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_rsa_keygen_2048():
    """Verify RSA-2048 keypair generation and PEM formatting."""
    res = client.post("/api/rsa/generate-keys", json={"key_size": 2048})
    assert res.status_code == 200
    data = res.json()
    assert data["algorithm"] == "RSA"
    assert data["key_size"] == 2048
    assert "-----BEGIN PUBLIC KEY-----" in data["public_key_pem"]
    assert "-----END PUBLIC KEY-----" in data["public_key_pem"]
    assert "-----BEGIN PRIVATE KEY-----" in data["private_key_pem"]
    assert "-----END PRIVATE KEY-----" in data["private_key_pem"]
    assert data["format"] == "PKCS#8 PEM"
    assert "execution_duration_ms" in data


def test_rsa_keygen_3072():
    """Verify RSA-3072 keypair generation."""
    res = client.post("/api/rsa/generate-keys", json={"key_size": 3072})
    assert res.status_code == 200
    data = res.json()
    assert data["key_size"] == 3072


def test_rsa_keygen_invalid_key_size():
    """Verify rejection of unsupported RSA key sizes."""
    res = client.post("/api/rsa/generate-keys", json={"key_size": 1024})
    assert res.status_code in (400, 422)


def test_rsa_roundtrip_encryption_decryption():
    """Verify successful encryption and decryption using RSA-OAEP (SHA-256)."""
    # 1. Generate keys
    keys = client.post("/api/rsa/generate-keys", json={"key_size": 2048}).json()
    pub_pem = keys["public_key_pem"]
    priv_pem = keys["private_key_pem"]

    original_text = "Asymmetric Secret Message for Alice & Bob (2026)"

    # 2. Encrypt
    enc_res = client.post(
        "/api/rsa/encrypt",
        json={"plaintext": original_text, "public_key_pem": pub_pem},
    )
    assert enc_res.status_code == 200
    enc_data = enc_res.json()
    assert enc_data["algorithm"] == "RSA-OAEP-SHA256"
    assert enc_data["key_size"] == 2048
    assert "ciphertext" in enc_data
    assert enc_data["padding"] == "OAEP-MGF1-SHA256"

    # Verify ciphertext length matches 2048 bits (256 bytes)
    ct_bytes = base64.b64decode(enc_data["ciphertext"])
    assert len(ct_bytes) == 256

    # 3. Decrypt
    dec_res = client.post(
        "/api/rsa/decrypt",
        json={"ciphertext": enc_data["ciphertext"], "private_key_pem": priv_pem},
    )
    assert dec_res.status_code == 200
    dec_data = dec_res.json()
    assert dec_data["algorithm"] == "RSA-OAEP-SHA256"
    assert dec_data["verified"] is True
    assert dec_data["plaintext"] == original_text


def test_rsa_decrypt_wrong_private_key():
    """Verify that decryption fails safely when private key does not match."""
    # Keypair 1
    keys1 = client.post("/api/rsa/generate-keys", json={"key_size": 2048}).json()
    # Keypair 2
    keys2 = client.post("/api/rsa/generate-keys", json={"key_size": 2048}).json()

    # Encrypt with Key 1
    enc = client.post(
        "/api/rsa/encrypt",
        json={"plaintext": "Secret Payload", "public_key_pem": keys1["public_key_pem"]},
    ).json()

    # Decrypt with Key 2
    dec_res = client.post(
        "/api/rsa/decrypt",
        json={"ciphertext": enc["ciphertext"], "private_key_pem": keys2["private_key_pem"]},
    )
    assert dec_res.status_code == 400
    assert "decryption failed" in dec_res.json()["detail"].lower()


def test_rsa_decrypt_tampered_ciphertext():
    """Verify that modified ciphertext is rejected."""
    keys = client.post("/api/rsa/generate-keys", json={"key_size": 2048}).json()

    enc = client.post(
        "/api/rsa/encrypt",
        json={"plaintext": "Tamper Test Payload", "public_key_pem": keys["public_key_pem"]},
    ).json()

    raw_ct = bytearray(base64.b64decode(enc["ciphertext"]))
    raw_ct[10] ^= 0xFF
    tampered_ct = base64.b64encode(raw_ct).decode("ascii")

    dec_res = client.post(
        "/api/rsa/decrypt",
        json={"ciphertext": tampered_ct, "private_key_pem": keys["private_key_pem"]},
    )
    assert dec_res.status_code == 400
    assert "decryption failed" in dec_res.json()["detail"].lower()


def test_rsa_invalid_key_pem_format():
    """Verify error handling on malformed PEM keys."""
    # Malformed public key
    enc_res = client.post(
        "/api/rsa/encrypt",
        json={"plaintext": "Test", "public_key_pem": "NOT_A_VALID_PEM_KEY"},
    )
    assert enc_res.status_code == 400
    assert "invalid rsa public key" in enc_res.json()["detail"].lower()

    # Malformed private key
    dec_res = client.post(
        "/api/rsa/decrypt",
        json={"ciphertext": base64.b64encode(b"0" * 256).decode(), "private_key_pem": "NOT_A_PEM"},
    )
    assert dec_res.status_code == 400
    assert "invalid rsa private key" in dec_res.json()["detail"].lower()


def test_rsa_plaintext_too_long():
    """Verify rejection when plaintext exceeds RSA-2048 OAEP-SHA256 capacity (190 bytes)."""
    keys = client.post("/api/rsa/generate-keys", json={"key_size": 2048}).json()
    oversized = "A" * 250

    enc_res = client.post(
        "/api/rsa/encrypt",
        json={"plaintext": oversized, "public_key_pem": keys["public_key_pem"]},
    )
    assert enc_res.status_code == 400
    assert "exceeds maximum capacity" in enc_res.json()["detail"].lower()


def test_rsa_empty_inputs():
    """Verify rejection of empty plaintext, ciphertext, and keys."""
    res1 = client.post("/api/rsa/encrypt", json={"plaintext": "", "public_key_pem": "pem"})
    assert res1.status_code in (400, 422)

    res2 = client.post("/api/rsa/encrypt", json={"plaintext": "msg", "public_key_pem": ""})
    assert res2.status_code in (400, 422)

    res3 = client.post("/api/rsa/decrypt", json={"ciphertext": "", "private_key_pem": "pem"})
    assert res3.status_code in (400, 422)

    res4 = client.post("/api/rsa/decrypt", json={"ciphertext": "ct", "private_key_pem": ""})
    assert res4.status_code in (400, 422)


def test_rsa_audit_history_no_secrets():
    """Verify that RSA key generation, encryption, and decryption are logged without secrets."""
    from app.api.endpoints.auth import get_current_user, get_optional_current_user
    from app.models.user import User

    mock_user = User(id=1, email="rsa_analyst@securecipher.org", full_name="RSA Analyst", is_active=True, is_verified=True)
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_optional_current_user] = lambda: mock_user

    try:
        keys = client.post("/api/rsa/generate-keys", json={"key_size": 2048}).json()
        enc = client.post(
            "/api/rsa/encrypt",
            json={"plaintext": "Audited RSA Payload", "public_key_pem": keys["public_key_pem"]},
        ).json()
        client.post(
            "/api/rsa/decrypt",
            json={"ciphertext": enc["ciphertext"], "private_key_pem": keys["private_key_pem"]},
        )

        history_res = client.get("/api/history")
        assert history_res.status_code == 200
        items = history_res.json()["items"]

        rsa_records = [r for r in items if "RSA" in r["algorithm_name"]]
        assert len(rsa_records) >= 3

        for r in rsa_records:
            assert r["operation_type"] in ("key_generation", "encryption", "decryption")
            for key in r.keys():
                assert "private" not in key.lower()
                assert "plaintext" not in key.lower()
                assert "ciphertext" not in key.lower()
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides.pop(get_optional_current_user, None)
