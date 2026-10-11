import base64
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_aes_roundtrip_success():
    """Verify successful encryption and decryption round-trip."""
    original_text = "Top Secret: Cryptographic Protection with AES-256-GCM."
    passphrase = "CorrectHorseBatteryStaple#2026"

    # 1. Encrypt
    encrypt_res = client.post(
        "/api/aes/encrypt",
        json={"plaintext": original_text, "passphrase": passphrase},
    )
    assert encrypt_res.status_code == 200
    enc_data = encrypt_res.json()

    assert enc_data["algorithm"] == "AES-256-GCM"
    assert "nonce" in enc_data
    assert "salt" in enc_data
    assert "ciphertext" in enc_data
    assert "tag" in enc_data
    assert "execution_duration_ms" in enc_data
    assert enc_data["kdf"]["algorithm"] == "scrypt"

    # Verify lengths of decoded cryptographic parameters
    nonce_bytes = base64.b64decode(enc_data["nonce"])
    salt_bytes = base64.b64decode(enc_data["salt"])
    tag_bytes = base64.b64decode(enc_data["tag"])
    assert len(nonce_bytes) == 12
    assert len(salt_bytes) == 16
    assert len(tag_bytes) == 16

    # 2. Decrypt
    decrypt_res = client.post(
        "/api/aes/decrypt",
        json={
            "passphrase": passphrase,
            "nonce": enc_data["nonce"],
            "salt": enc_data["salt"],
            "ciphertext": enc_data["ciphertext"],
            "tag": enc_data["tag"],
        },
    )
    assert decrypt_res.status_code == 200
    dec_data = decrypt_res.json()
    assert dec_data["algorithm"] == "AES-256-GCM"
    assert dec_data["verified"] is True
    assert dec_data["plaintext"] == original_text


def test_aes_fresh_nonce_and_salt():
    """Ensure two encryptions of identical text and passphrase produce unique nonces, salts and ciphertexts."""
    text = "Deterministic plaintext test"
    passphrase = "SamePassphrase123"

    res1 = client.post("/api/aes/encrypt", json={"plaintext": text, "passphrase": passphrase}).json()
    res2 = client.post("/api/aes/encrypt", json={"plaintext": text, "passphrase": passphrase}).json()

    assert res1["nonce"] != res2["nonce"], "Nonce must never be reused"
    assert res1["salt"] != res2["salt"], "Salt must be randomized per encryption"
    assert res1["ciphertext"] != res2["ciphertext"]


def test_aes_incorrect_passphrase():
    """Verify that decryption with an incorrect passphrase fails safely."""
    encrypt_res = client.post(
        "/api/aes/encrypt",
        json={"plaintext": "Confidential research data", "passphrase": "CorrectPassphrase"},
    ).json()

    decrypt_res = client.post(
        "/api/aes/decrypt",
        json={
            "passphrase": "WrongPassphraseHere",
            "nonce": encrypt_res["nonce"],
            "salt": encrypt_res["salt"],
            "ciphertext": encrypt_res["ciphertext"],
            "tag": encrypt_res["tag"],
        },
    )
    assert decrypt_res.status_code == 400
    detail = decrypt_res.json()["detail"]
    assert "authentication tag verification failed" in detail.lower()


def test_aes_modified_ciphertext():
    """Verify that tampered ciphertext is rejected by authentication tag verification."""
    encrypt_res = client.post(
        "/api/aes/encrypt",
        json={"plaintext": "Financial Wire: Transfer $1000", "passphrase": "BankSecureKey"},
    ).json()

    raw_ct = bytearray(base64.b64decode(encrypt_res["ciphertext"]))
    # Flip the first byte
    raw_ct[0] ^= 0xFF
    tampered_ct = base64.b64encode(raw_ct).decode("ascii")

    decrypt_res = client.post(
        "/api/aes/decrypt",
        json={
            "passphrase": "BankSecureKey",
            "nonce": encrypt_res["nonce"],
            "salt": encrypt_res["salt"],
            "ciphertext": tampered_ct,
            "tag": encrypt_res["tag"],
        },
    )
    assert decrypt_res.status_code == 400
    assert "authentication tag verification failed" in decrypt_res.json()["detail"].lower()


def test_aes_modified_tag():
    """Verify that tampered GCM tag is rejected."""
    encrypt_res = client.post(
        "/api/aes/encrypt",
        json={"plaintext": "Data integrity test", "passphrase": "Key123"},
    ).json()

    raw_tag = bytearray(base64.b64decode(encrypt_res["tag"]))
    raw_tag[0] ^= 0x01
    tampered_tag = base64.b64encode(raw_tag).decode("ascii")

    decrypt_res = client.post(
        "/api/aes/decrypt",
        json={
            "passphrase": "Key123",
            "nonce": encrypt_res["nonce"],
            "salt": encrypt_res["salt"],
            "ciphertext": encrypt_res["ciphertext"],
            "tag": tampered_tag,
        },
    )
    assert decrypt_res.status_code == 400
    assert "authentication tag verification failed" in decrypt_res.json()["detail"].lower()


def test_aes_malformed_base64_and_invalid_length():
    """Verify that malformed base64 and invalid parameter lengths are rejected."""
    # Malformed base64
    res_b64 = client.post(
        "/api/aes/decrypt",
        json={
            "passphrase": "Pass",
            "nonce": "not-valid-base64!@#$",
            "salt": base64.b64encode(b"0" * 16).decode(),
            "ciphertext": base64.b64encode(b"cipher").decode(),
            "tag": base64.b64encode(b"0" * 16).decode(),
        },
    )
    assert res_b64.status_code == 400
    assert "invalid base64" in res_b64.json()["detail"].lower()

    # Invalid nonce length (8 bytes instead of 12)
    res_len = client.post(
        "/api/aes/decrypt",
        json={
            "passphrase": "Pass",
            "nonce": base64.b64encode(b"0" * 8).decode(),
            "salt": base64.b64encode(b"0" * 16).decode(),
            "ciphertext": base64.b64encode(b"cipher").decode(),
            "tag": base64.b64encode(b"0" * 16).decode(),
        },
    )
    assert res_len.status_code == 400
    assert "invalid nonce length" in res_len.json()["detail"].lower()


def test_aes_empty_input():
    """Verify validation when plaintext or passphrase is empty."""
    # Empty plaintext
    res1 = client.post("/api/aes/encrypt", json={"plaintext": "", "passphrase": "pass"})
    assert res1.status_code in (400, 422)

    # Whitespace plaintext
    res2 = client.post("/api/aes/encrypt", json={"plaintext": "   ", "passphrase": "pass"})
    assert res2.status_code in (400, 422)

    # Empty passphrase on encrypt
    res3 = client.post("/api/aes/encrypt", json={"plaintext": "text", "passphrase": ""})
    assert res3.status_code in (400, 422)

    # Empty passphrase on decrypt
    res4 = client.post(
        "/api/aes/decrypt",
        json={
            "passphrase": "",
            "nonce": base64.b64encode(b"0" * 12).decode(),
            "salt": base64.b64encode(b"0" * 16).decode(),
            "ciphertext": base64.b64encode(b"c").decode(),
            "tag": base64.b64encode(b"0" * 16).decode(),
        },
    )
    assert res4.status_code in (400, 422)


def test_aes_audit_history_recorded_without_secrets():
    """Verify that AES operations are logged in history without storing secret payloads."""
    # Run an encryption
    client.post(
        "/api/aes/encrypt",
        json={"plaintext": "Audit Trail Verification", "passphrase": "AuditPassphrase123"},
    )

    history_res = client.post(
        "/api/history",
    ) if client.post("/api/history").status_code == 200 else client.get("/api/history")
    
    assert history_res.status_code == 200
    hist_data = history_res.json()
    assert hist_data["total"] >= 1

    latest = hist_data["items"][0]
    assert latest["algorithm_name"] == "AES-256-GCM"
    assert latest["operation_type"] in ("encryption", "decryption")
    assert latest["status"] in ("success", "failure")
    assert "execution_duration_ms" in latest

    # Verify that no secret field exists in the returned items
    for key in latest.keys():
        assert "plaintext" not in key
        assert "key" not in key or key == "algorithm_name"
        assert "passphrase" not in key
        assert "ciphertext" not in key
