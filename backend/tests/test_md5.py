import io
import hashlib
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

EMPTY_MD5 = "d41d8cd98f00b204e9800998ecf8427e"
A_MD5 = "0cc175b9c0f1b6a831c399e269772661"
ABC_MD5 = "900150983cd24fb0d6963f7d28e17f72"
MESSAGE_DIGEST_MD5 = "f96b697d7cb7938d525a2f31aaf161d0"
ALPHABET_MD5 = "c3fcd3d76192e4007dfb496cca67e13b"


def test_md5_known_test_vectors():
    """Verify official RFC 1321 standard MD5 test vectors."""
    vectors = [
        ("", EMPTY_MD5),
        ("a", A_MD5),
        ("abc", ABC_MD5),
        ("message digest", MESSAGE_DIGEST_MD5),
        ("abcdefghijklmnopqrstuvwxyz", ALPHABET_MD5),
    ]

    for text, expected in vectors:
        res = client.post("/api/md5/hash-text", json={"text": text})
        assert res.status_code == 200
        data = res.json()
        assert data["algorithm"] == "MD5"
        assert data["digest"] == expected
        assert len(data["digest"]) == 32
        assert data["digest"] == data["digest"].lower()
        assert data["byte_length"] == len(text.encode("utf-8"))
        assert "execution_duration_ms" in data
        assert "security_warning" in data
        assert "broken" in data["security_warning"].lower()


def test_md5_text_empty_input():
    """Explicitly verify empty input generates valid 32-character RFC 1321 empty digest."""
    res = client.post("/api/md5/hash-text", json={"text": ""})
    assert res.status_code == 200
    data = res.json()
    assert data["digest"] == EMPTY_MD5
    assert data["byte_length"] == 0


def test_md5_avalanche_effect_changed_content():
    """Verify that a single character change results in a radically different 128-bit digest."""
    text1 = "The quick brown fox jumps over the lazy dog."
    text2 = "The quick brown fox jumps over the lazy dog,"  # only last char differs

    res1 = client.post("/api/md5/hash-text", json={"text": text1}).json()
    res2 = client.post("/api/md5/hash-text", json={"text": text2}).json()

    assert res1["digest"] != res2["digest"]

    # Compare via endpoint
    comp_res = client.post(
        "/api/md5/compare",
        json={"input_a": text1, "input_b": text2, "compare_mode": "text_vs_text"},
    )
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["is_match"] is False
    assert comp_data["hamming_distance_bits"] > 40  # Out of 128 bits
    assert comp_data["bit_difference_percentage"] > 30.0


def test_md5_compare_matching_text():
    """Verify matching inputs return is_match=True and zero bit difference."""
    text = "SecureCipher Legacy MD5 Demonstration 2026"
    res = client.post(
        "/api/md5/compare",
        json={"input_a": text, "input_b": text, "compare_mode": "text_vs_text"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_match"] is True
    assert data["hash_a"] == data["hash_b"]
    assert data["hamming_distance_bits"] == 0
    assert data["bit_difference_percentage"] == 0.0


def test_md5_compare_non_matching_text():
    """Verify non-matching inputs return is_match=False."""
    res = client.post(
        "/api/md5/compare",
        json={"input_a": "SecureCipherAlice", "input_b": "SecureCipherBob", "compare_mode": "text_vs_text"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_match"] is False
    assert data["hash_a"] != data["hash_b"]
    assert data["hamming_distance_bits"] > 0


def test_md5_compare_text_vs_hash_matching():
    """Verify text comparison against expected 32-hexadecimal checksum."""
    res = client.post(
        "/api/md5/compare",
        json={"input_a": "abc", "input_b": ABC_MD5, "compare_mode": "text_vs_hash"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["is_match"] is True
    assert data["hash_a"] == ABC_MD5
    assert data["hash_b"] == ABC_MD5


def test_md5_compare_text_vs_hash_invalid_checksum():
    """Verify rejecting invalid non-32-hex expected checksum."""
    res = client.post(
        "/api/md5/compare",
        json={"input_a": "abc", "input_b": "not-valid-32-hex", "compare_mode": "text_vs_hash"},
    )
    assert res.status_code == 400
    assert "32-character hexadecimal" in res.json()["detail"]


def test_md5_invalid_compare_mode():
    """Verify invalid compare_mode returns 400 Bad Request."""
    res = client.post(
        "/api/md5/compare",
        json={"input_a": "abc", "input_b": "abc", "compare_mode": "unknown_mode"},
    )
    assert res.status_code == 400
    assert "Invalid compare_mode" in res.json()["detail"]


def test_md5_file_stream_hashing():
    """Verify streamed chunked hashing of an uploaded file."""
    file_content = b"Streamed chunk-by-chunk legacy cryptographic test payload for MD5."
    expected_digest = hashlib.md5(file_content).hexdigest().lower()

    file_obj = io.BytesIO(file_content)
    files = {"file": ("legacy_test.txt", file_obj, "text/plain")}

    res = client.post("/api/md5/hash-file", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["algorithm"] == "MD5"
    assert data["filename"] == "legacy_test.txt"
    assert data["digest"] == expected_digest
    assert len(data["digest"]) == 32
    assert data["file_size_bytes"] == len(file_content)
    assert data["content_type"] == "text/plain"
    assert "execution_duration_ms" in data


def test_md5_file_stream_empty_file():
    """Verify streamed hashing of an empty 0-byte file."""
    empty_file = io.BytesIO(b"")
    files = {"file": ("empty_md5.dat", empty_file, "application/octet-stream")}

    res = client.post("/api/md5/hash-file", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["digest"] == EMPTY_MD5
    assert data["file_size_bytes"] == 0


def test_md5_audit_history_no_plaintext():
    """Verify that MD5 operations log execution metrics in PostgreSQL without storing input text or digests."""
    secret_text = "Legacy Database Migration Password Hash Simulation"
    hash_res = client.post("/api/md5/hash-text", json={"text": secret_text})
    assert hash_res.status_code == 200

    hist_res = client.post("/api/history?limit=10")
    if hist_res.status_code == 200:
        hist_data = hist_res.json()
        if hist_data.get("database_connected") and hist_data.get("items"):
            for item in hist_data["items"]:
                assert secret_text not in str(item.values())
                assert EMPTY_MD5 not in str(item.values())
