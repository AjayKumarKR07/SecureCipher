from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "SecureCipher"
    assert "api_health" in data


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["project"] == "SecureCipher"
    assert "timestamp" in data


def test_health_database():
    response = client.get("/api/health/database")
    # Response code is either 200 (if connected) or 503 (if unconfigured/disconnected)
    assert response.status_code in (200, 503)
    data = response.json()
    assert "status" in data
    assert "connected" in data
    assert "message" in data


def test_algorithms():
    response = client.get("/api/algorithms")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 6
    assert len(data["algorithms"]) == 6
    algo_ids = [a["id"] for a in data["algorithms"]]
    assert "aes" in algo_ids
    assert "rsa" in algo_ids
    assert "diffie-hellman" in algo_ids
    assert "sha-256" in algo_ids
    assert "md5" in algo_ids
    assert "des" in algo_ids


def test_single_algorithm():
    response = client.get("/api/algorithms/aes")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "aes"
    assert "Advanced Encryption Standard" in data["name"]


def test_single_algorithm_not_found():
    response = client.get("/api/algorithms/nonexistent")
    assert response.status_code == 404


def test_history():
    response = client.get("/api/history")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)


def test_delete_history_item_not_found():
    response = client.delete("/api/history/99999999")
    assert response.status_code in (404, 400)

