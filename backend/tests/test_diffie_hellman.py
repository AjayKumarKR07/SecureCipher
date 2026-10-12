import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db
from app.models.history import OperationHistory

client = TestClient(app)


def test_dh_keygen_success():
    """Verify DH keypair generation returns standard RFC 3526 Group 14 parameters and valid PEMs."""
    response = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Alice"})
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "Diffie-Hellman (RFC 3526 MODP Group 14)"
    assert data["group_name"] == "MODP Group 14 (2048-bit)"
    assert data["prime_bits"] == 2048
    assert data["generator"] == 2
    assert data["party_name"] == "Alice"
    assert "-----BEGIN PUBLIC KEY-----" in data["public_key_pem"]
    assert "-----END PUBLIC KEY-----" in data["public_key_pem"]
    assert "-----BEGIN PRIVATE KEY-----" in data["private_key_pem"]
    assert "-----END PRIVATE KEY-----" in data["private_key_pem"]
    assert len(data["public_key_hex"]) > 100
    assert data["execution_duration_ms"] >= 0.0


def test_dh_independent_keypairs_different():
    """Verify independently generated DH keypairs have distinct private and public keys."""
    resp_a = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Alice"})
    resp_b = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Bob"})
    assert resp_a.status_code == 200
    assert resp_b.status_code == 200
    alice = resp_a.json()
    bob = resp_b.json()

    assert alice["public_key_pem"] != bob["public_key_pem"]
    assert alice["private_key_pem"] != bob["private_key_pem"]
    assert alice["public_key_hex"] != bob["public_key_hex"]


def test_dh_shared_secret_agreement():
    """Verify Alice and Bob independently arrive at identical HKDF-SHA256 derived keys."""
    # 1. Generate Alice's keys
    resp_a = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Alice"})
    alice = resp_a.json()

    # 2. Generate Bob's keys
    resp_b = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Bob"})
    bob = resp_b.json()

    # 3. Alice derives shared secret using Bob's public key
    derive_a = client.post(
        "/api/diffie-hellman/derive-secret",
        json={
            "private_key_pem": alice["private_key_pem"],
            "peer_public_key_pem": bob["public_key_pem"],
            "info": "SecureCipher Handshake Test",
        },
    )
    assert derive_a.status_code == 200
    res_a = derive_a.json()

    # 4. Bob derives shared secret using Alice's public key
    derive_b = client.post(
        "/api/diffie-hellman/derive-secret",
        json={
            "private_key_pem": bob["private_key_pem"],
            "peer_public_key_pem": alice["public_key_pem"],
            "info": "SecureCipher Handshake Test",
        },
    )
    assert derive_b.status_code == 200
    res_b = derive_b.json()

    # Both derived keys must match completely!
    assert res_a["derived_key_b64"] == res_b["derived_key_b64"]
    assert res_a["derived_key_hex"] == res_b["derived_key_hex"]
    assert res_a["key_fingerprint"] == res_b["key_fingerprint"]
    assert res_a["shared_secret_length_bytes"] == 256
    assert res_a["kdf"] == "HKDF-SHA256"


def test_dh_simulate_exchange():
    """Verify full end-to-end Alice <-> Bob exchange simulation endpoint."""
    response = client.post("/api/diffie-hellman/simulate-exchange")
    assert response.status_code == 200
    data = response.json()
    assert data["algorithm"] == "Diffie-Hellman (RFC 3526 MODP Group 14)"
    assert data["group_name"] == "MODP Group 14 (2048-bit)"
    assert data["generator"] == 2
    assert data["key_match"] is True
    assert data["alice_derived_key_b64"] == data["bob_derived_key_b64"]
    assert len(data["key_fingerprint"]) == 64
    assert data["alice"]["party_name"] == "Alice"
    assert data["bob"]["party_name"] == "Bob"
    assert data["alice"]["public_key_pem"] != data["bob"]["public_key_pem"]


def test_dh_key_derivation_different_with_third_party():
    """Verify that exchanging with an unrelated third party produces a different derived key."""
    alice = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Alice"}).json()
    bob = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Bob"}).json()
    eve = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Eve"}).json()

    res_alice_bob = client.post(
        "/api/diffie-hellman/derive-secret",
        json={
            "private_key_pem": alice["private_key_pem"],
            "peer_public_key_pem": bob["public_key_pem"],
        },
    ).json()

    res_alice_eve = client.post(
        "/api/diffie-hellman/derive-secret",
        json={
            "private_key_pem": alice["private_key_pem"],
            "peer_public_key_pem": eve["public_key_pem"],
        },
    ).json()

    assert res_alice_bob["derived_key_b64"] != res_alice_eve["derived_key_b64"]
    assert res_alice_bob["key_fingerprint"] != res_alice_eve["key_fingerprint"]


def test_dh_different_hkdf_info_different_keys():
    """Verify that different HKDF context infos produce different derived keys from same shared secret."""
    alice = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Alice"}).json()
    bob = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Bob"}).json()

    res_ctx1 = client.post(
        "/api/diffie-hellman/derive-secret",
        json={
            "private_key_pem": alice["private_key_pem"],
            "peer_public_key_pem": bob["public_key_pem"],
            "info": "Application Context A",
        },
    ).json()

    res_ctx2 = client.post(
        "/api/diffie-hellman/derive-secret",
        json={
            "private_key_pem": alice["private_key_pem"],
            "peer_public_key_pem": bob["public_key_pem"],
            "info": "Application Context B",
        },
    ).json()

    assert res_ctx1["derived_key_b64"] != res_ctx2["derived_key_b64"]


def test_dh_derive_malformed_private_key():
    """Verify proper HTTP 400 error when private key PEM is corrupted or invalid."""
    bob = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Bob"}).json()

    response = client.post(
        "/api/diffie-hellman/derive-secret",
        json={
            "private_key_pem": "-----BEGIN PRIVATE KEY-----\nCORRUPTED_BASE64_DATA\n-----END PRIVATE KEY-----",
            "peer_public_key_pem": bob["public_key_pem"],
        },
    )
    assert response.status_code == 400
    assert "Invalid private key PEM format" in response.json()["detail"]


def test_dh_derive_malformed_peer_public_key():
    """Verify proper HTTP 400 error when peer public key PEM is corrupted or invalid."""
    alice = client.post("/api/diffie-hellman/generate-keypair", json={"party_name": "Alice"}).json()

    response = client.post(
        "/api/diffie-hellman/derive-secret",
        json={
            "private_key_pem": alice["private_key_pem"],
            "peer_public_key_pem": "-----BEGIN PUBLIC KEY-----\nCORRUPTED_PEER_KEY\n-----END PUBLIC KEY-----",
        },
    )
    assert response.status_code == 400
    assert "Invalid peer public key PEM format" in response.json()["detail"]


def test_dh_empty_inputs():
    """Verify HTTP 400 error when required PEM fields are empty or whitespace."""
    response = client.post(
        "/api/diffie-hellman/derive-secret",
        json={
            "private_key_pem": "   ",
            "peer_public_key_pem": "   ",
        },
    )
    assert response.status_code == 400


def test_dh_audit_history_no_secrets():
    """Verify PostgreSQL operation history logs DH operations while strictly omitting all keys and secrets."""
    # Perform a DH simulation
    sim_resp = client.post("/api/diffie-hellman/simulate-exchange")
    assert sim_resp.status_code == 200
    data = sim_resp.json()
    alice_priv = data["alice"]["private_key_pem"]
    derived_b64 = data["alice_derived_key_b64"]

    # Query history via API
    hist_resp = client.post(
        "/api/diffie-hellman/generate-keypair",
        json={"party_name": "AuditParty"},
    )
    assert hist_resp.status_code == 200

    api_hist = client.get("/api/history")
    assert api_hist.status_code == 200
    records = api_hist.json()["items"]

    dh_records = [r for r in records if r["algorithm_name"] == "Diffie-Hellman"]
    assert len(dh_records) > 0

    # Ensure none of the audit history entries contain private keys or secrets
    db_gen = get_db()
    db = next(db_gen)
    if db:
        db_records = db.query(OperationHistory).filter(OperationHistory.algorithm_name == "Diffie-Hellman").all()
        for rec in db_records:
            # OperationHistory model only contains:
            # id, algorithm_name, operation_type, status, execution_duration_ms, created_at
            assert hasattr(rec, "algorithm_name")
            assert hasattr(rec, "operation_type")
            assert not hasattr(rec, "private_key")
            assert not hasattr(rec, "shared_secret")
            assert not hasattr(rec, "derived_key")
            # Verify string representation doesn't leak secrets
            rec_str = str(rec.__dict__)
            assert alice_priv not in rec_str
            assert derived_b64 not in rec_str
