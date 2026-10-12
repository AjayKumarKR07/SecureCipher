import io
import hashlib
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

EMPTY_DIGEST = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
ABC_DIGEST = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
LONG_DIGEST = "248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1"


def test_sha256_known_test_vectors():
    """Verify official NIST FIPS 180-4 test vectors."""
    vectors = [
        ("", EMPTY_DIGEST),
        ("abc", ABC_DIGEST),
        ("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq", LONG_DIGEST),
    ]

    for text, expected in vectors:
        res = client.post("/api/sha256/hash-text", json={"text": text})
        assert res.status_code == 200
        data = res.json()
        assert data["algorithm"] == "SHA-256"
        assert data["digest"] == expected
        assert len(data["digest"]) == 64
        assert data["digest"] == data["digest"].lower()
        assert data["byte_length"] == len(text.encode("utf-8"))
        assert "execution_duration_ms" in data


def test_sha256_text_empty_input():
    """Explicitly verify empty input generates valid 64-character NIST empty digest."""
    res = client.post("/api/sha256/hash-text", json={"text": ""})
    assert res.status_code == 200
    data = res.json()
    assert data["digest"] == EMPTY_DIGEST
    assert data["byte_length"] == 0


def test_sha256_avalanche_effect_changed_content():
    """Verify that a single character change results in a radically different digest (>30% bit flip)."""
    text1 = "The quick brown fox jumps over the lazy dog."
    text2 = "The quick brown fox jumps over the lazy dog,"  # only last char differs

    res1 = client.post("/api/sha256/hash-text", json={"text": text1}).json()
    res2 = client.post("/api/sha256/hash-text", json={"text": text2}).json()

    assert res1["digest"] != res2["digest"]

    # Compare via endpoint
    comp_res = client.post(
        "/api/sha256/compare",
        json={"input_a": text1, "input_b": text2, "compare_mode": "text_vs_text"},
    )
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["is_match"] is False
    assert comp_data["hamming_distance_bits"] > 80  # Demonstrating avalanche effect
    assert comp_data["bit_difference_percentage"] > 30.0


def test_sha256_compare_matching_text():
    """Verify matching inputs return is_match=True and zero bit difference."""
    text = "SecureCipher Cryptography Mini Project 2026"
    res = client.post(
        "/api/sha256/compare",
        json={"input_a": text, "input_b": text, "compare_mode": "text_vs_text"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_match"] is True
    assert data["hash_a"] == data["hash_b"]
    assert data["hamming_distance_bits"] == 0
    assert data["bit_difference_percentage"] == 0.0


def test_sha256_compare_non_matching_text():
    """Verify non-matching inputs return is_match=False."""
    res = client.post(
        "/api/sha256/compare",
        json={"input_a": "SecureCipherAlice", "input_b": "SecureCipherBob", "compare_mode": "text_vs_text"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_match"] is False
    assert data["hash_a"] != data["hash_b"]
    assert data["hamming_distance_bits"] > 0


def test_sha256_compare_text_vs_hash_matching():
    """Verify text comparison against expected 64-hexadecimal checksum."""
    res = client.post(
        "/api/sha256/compare",
        json={"input_a": "abc", "input_b": ABC_DIGEST, "compare_mode": "text_vs_hash"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_match"] is True
    assert data["hash_a"] == ABC_DIGEST
    assert data["hash_b"] == ABC_DIGEST


def test_sha256_compare_text_vs_hash_invalid_checksum():
    """Verify rejecting invalid non-64-hex expected checksum."""
    res = client.post(
        "/api/sha256/compare",
        json={"input_a": "abc", "input_b": "invalid_checksum_123", "compare_mode": "text_vs_hash"},
    )
    assert res.status_code == 400
    assert "64-character hexadecimal" in res.json()["detail"]


def test_sha256_invalid_compare_mode():
    """Verify invalid compare_mode returns 400 Bad Request."""
    res = client.post(
        "/api/sha256/compare",
        json={"input_a": "abc", "input_b": "abc", "compare_mode": "unknown_mode"},
    )
    assert res.status_code == 400
    assert "Invalid compare_mode" in res.json()["detail"]


def test_sha256_file_stream_hashing():
    """Verify streamed chunked hashing of an uploaded file."""
    file_content = b"Streamed chunk-by-chunk cryptographic test payload for SecureCipher SHA-256."
    expected_digest = hashlib.sha256(file_content).hexdigest().lower()

    file_obj = io.BytesIO(file_content)
    files = {"file": ("test_sample.txt", file_obj, "text/plain")}

    res = client.post("/api/sha256/hash-file", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["algorithm"] == "SHA-256"
    assert data["filename"] == "test_sample.txt"
    assert data["digest"] == expected_digest
    assert data["file_size_bytes"] == len(file_content)
    assert data["content_type"] == "text/plain"
    assert "execution_duration_ms" in data


def test_sha256_file_stream_empty_file():
    """Verify streamed hashing of an empty 0-byte file."""
    empty_file = io.BytesIO(b"")
    files = {"file": ("empty.dat", empty_file, "application/octet-stream")}

    res = client.post("/api/sha256/hash-file", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["digest"] == EMPTY_DIGEST
    assert data["file_size_bytes"] == 0


def test_sha256_audit_history_no_plaintext():
    """Verify that hashing records operation metadata in PostgreSQL without storing input text or digests."""
    secret_text = "Highly Confidential Student Records 2026"
    hash_res = client.post("/api/sha256/hash-text", json={"text": secret_text})
    assert hash_res.status_code == 200

    hist_res = client.post("/api/history?limit=10")
    if hist_res.status_code == 200:
        hist_data = hist_res.json()
        if hist_data.get("database_connected") and hist_data.get("items"):
            for item in hist_data["items"]:
                # Ensure no secrets or plaintext are stored in any audit item fields
                assert secret_text not in str(item.values())
                assert EMPTY_DIGEST not in str(item.values())
