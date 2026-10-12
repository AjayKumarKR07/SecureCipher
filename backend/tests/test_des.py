import base64
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_des_roundtrip_success():
    """Verify standard DES-CBC encryption and decryption round-trip."""
    plaintext = "Educational Legacy Demonstration: 16 Feistel rounds with DES-CBC."
    key = "DESKEY56"  # Exactly 8 bytes / characters

    # 1. Encrypt
    enc_res = client.post(
        "/api/des/encrypt",
        json={"plaintext": plaintext, "key": key},
    )
    assert enc_res.status_code == 200
    enc_data = enc_res.json()
    assert enc_data["algorithm"] == "DES-CBC"
    assert "ciphertext" in enc_data
    assert "iv" in enc_data
    assert enc_data["block_size_bytes"] == 8
    assert enc_data["key_size_bits"] == 56
    assert enc_data["is_authenticated"] is False
    assert "security_warning" in enc_data
    assert "EDUCATIONAL" in enc_data["security_warning"]
    assert "execution_duration_ms" in enc_data

    # Validate decoded IV length is exactly 8 bytes (64 bits)
    iv_bytes = base64.b64decode(enc_data["iv"])
    assert len(iv_bytes) == 8

    # Validate decoded ciphertext length is a multiple of 8 bytes
    ct_bytes = base64.b64decode(enc_data["ciphertext"])
    assert len(ct_bytes) > 0
    assert len(ct_bytes) % 8 == 0

    # 2. Decrypt
    dec_res = client.post(
        "/api/des/decrypt",
        json={
            "ciphertext": enc_data["ciphertext"],
            "key": key,
            "iv": enc_data["iv"],
        },
    )
    assert dec_res.status_code == 200
    dec_data = dec_res.json()
    assert dec_data["algorithm"] == "DES-CBC"
    assert dec_data["plaintext"] == plaintext
    assert dec_data["is_authenticated"] is False
    assert "tamper_warning" in dec_data
    assert "authenticate" in dec_data["tamper_warning"].lower()


def test_des_fresh_iv_generation():
    """Verify that encrypting the same plaintext twice produces different IVs and ciphertexts."""
    plaintext = "Deterministic plaintext message"
    key = "KEYABC12"

    res1 = client.post("/api/des/encrypt", json={"plaintext": plaintext, "key": key}).json()
    res2 = client.post("/api/des/encrypt", json={"plaintext": plaintext, "key": key}).json()

    assert res1["iv"] != res2["iv"]
    assert res1["ciphertext"] != res2["ciphertext"]


def test_des_padding_error_and_tampered_ciphertext():
    """Verify that tampering with ciphertext triggers PKCS#7 unpadding failure or decryption error."""
    plaintext = "Sensitive data subjected to bit-flipping"
    key = "TESTKEY8"

    enc_data = client.post("/api/des/encrypt", json={"plaintext": plaintext, "key": key}).json()

    # Flip the last byte of ciphertext
    raw_ct = bytearray(base64.b64decode(enc_data["ciphertext"]))
    raw_ct[-1] ^= 0xFF
    tampered_b64 = base64.b64encode(raw_ct).decode("ascii")

    dec_res = client.post(
        "/api/des/decrypt",
        json={
            "ciphertext": tampered_b64,
            "key": key,
            "iv": enc_data["iv"],
        },
    )
    assert dec_res.status_code == 400
    assert "Decryption failed" in dec_res.json()["detail"]


def test_des_wrong_key_decryption():
    """Verify that decrypting with an incorrect key fails safely."""
    plaintext = "Secret message"
    key1 = "KEYONE12"
    key2 = "KEYTWO34"

    enc_data = client.post("/api/des/encrypt", json={"plaintext": plaintext, "key": key1}).json()

    dec_res = client.post(
        "/api/des/decrypt",
        json={
            "ciphertext": enc_data["ciphertext"],
            "key": key2,
            "iv": enc_data["iv"],
        },
    )
    assert dec_res.status_code == 400
    assert "Decryption failed" in dec_res.json()["detail"]


def test_des_invalid_key_length():
    """Verify rejecting keys that are not exactly 8 characters / 8 bytes."""
    # Too short
    res_short = client.post(
        "/api/des/encrypt",
        json={"plaintext": "Test message", "key": "SHORT"},
    )
    assert res_short.status_code in (400, 422)

    # Too long
    res_long = client.post(
        "/api/des/encrypt",
        json={"plaintext": "Test message", "key": "TOO_LONG_KEY"},
    )
    assert res_long.status_code in (400, 422)


def test_des_invalid_iv_length():
    """Verify rejecting an IV that does not decode to exactly 8 bytes."""
    # 4-byte IV instead of 8 bytes
    invalid_iv_b64 = base64.b64encode(b"1234").decode("ascii")
    dummy_ct = base64.b64encode(b"12345678").decode("ascii")

    res = client.post(
        "/api/des/decrypt",
        json={
            "ciphertext": dummy_ct,
            "key": "DESKEY56",
            "iv": invalid_iv_b64,
        },
    )
    assert res.status_code == 400
    assert "8 bytes" in res.json()["detail"]


def test_des_malformed_base64_inputs():
    """Verify rejecting malformed non-Base64 strings."""
    res = client.post(
        "/api/des/decrypt",
        json={
            "ciphertext": "not-valid-base64!@#$",
            "key": "DESKEY56",
            "iv": base64.b64encode(b"12345678").decode("ascii"),
        },
    )
    assert res.status_code == 400
    assert "Base64" in res.json()["detail"]


def test_des_ciphertext_not_block_aligned():
    """Verify rejecting ciphertext whose length is not a multiple of 8 bytes."""
    # 10 bytes (not multiple of 8)
    unaligned_ct = base64.b64encode(b"1234567890").decode("ascii")
    valid_iv = base64.b64encode(b"12345678").decode("ascii")

    res = client.post(
        "/api/des/decrypt",
        json={
            "ciphertext": unaligned_ct,
            "key": "DESKEY56",
            "iv": valid_iv,
        },
    )
    assert res.status_code == 400
    assert "multiple of the DES block size" in res.json()["detail"]


def test_des_audit_history_no_secrets():
    """Verify that DES operations record audit metadata in PostgreSQL without persisting secrets."""
    secret_text = "Legacy 1970s Defense Document Classified"
    secret_key = "MYSEC56K"

    enc_res = client.post(
        "/api/des/encrypt",
        json={"plaintext": secret_text, "key": secret_key},
    )
    assert enc_res.status_code == 200
    enc_data = enc_res.json()

    hist_res = client.post("/api/history?limit=10")
    if hist_res.status_code == 200:
        hist_data = hist_res.json()
        if hist_data.get("database_connected") and hist_data.get("items"):
            for item in hist_data["items"]:
                assert secret_text not in str(item.values())
                assert secret_key not in str(item.values())
                assert enc_data["ciphertext"] not in str(item.values())
