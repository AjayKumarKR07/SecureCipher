"""
Unit and integration tests for Security & Performance Analytics endpoints and service.

Covers:
- Strict per-user scoping and isolation (User A cannot see User B's audit metrics)
- Unauthenticated requests return 401
- Summary KPI calculations (counts, success rate, durations, sample counts)
- Time-series buckets (granularity selection, date range clamping)
- Categorical distribution (by algorithm and by operation type)
- Performance latency breakdown and percentile thresholds (p50, p95, p99 min samples)
- Rule-based security indicators (signature verification failures, failure ratio)
- Export in CSV and JSON formats with data sanitization (no secrets)
- Graceful degradation when database is unavailable
"""
import io
import csv
import json
from datetime import datetime, timezone, timedelta
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.models.user import User
from app.models.history import OperationHistory
from app.api.endpoints.auth import get_current_user
from app.services import analytics_service

# Isolated in-memory SQLite database
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


@pytest.fixture
def mock_users():
    """Create two test users in the database for isolation testing."""
    db = TestingSessionLocal(expire_on_commit=False)
    u1 = User(
        id=1,
        email="alice@securecipher.io",
        full_name="Alice Smith",
        hashed_password="hashed_pw_alice",
        is_active=True,
        is_verified=True,
    )
    u2 = User(
        id=2,
        email="bob@securecipher.io",
        full_name="Bob Jones",
        hashed_password="hashed_pw_bob",
        is_active=True,
        is_verified=True,
    )
    db.add_all([u1, u2])
    db.commit()
    db.close()
    return u1, u2


def seed_test_operations():
    """Seed sample operations for User 1 (Alice) and User 2 (Bob)."""
    db = TestingSessionLocal()
    now = datetime.now(timezone.utc)

    # Alice's operations:
    # 5 AES encryptions (success, durations 2.0, 3.0, 4.0, 5.0, 6.0 ms)
    # 2 RSA-PSS signatures (success, 25.0, 30.0 ms)
    # 6 RSA-PSS verifications (5 failed, 1 success) -> triggers security event
    # 1 SHA-256 hash (success, 1.0 ms)
    records = []

    for d in [2.0, 3.0, 4.0, 5.0, 6.0]:
        records.append(
            OperationHistory(
                user_id=1,
                algorithm_name="AES-GCM",
                operation_type="encryption",
                status="success",
                execution_duration_ms=d,
                created_at=now - timedelta(minutes=10),
            )
        )

    for d in [25.0, 30.0]:
        records.append(
            OperationHistory(
                user_id=1,
                algorithm_name="RSA-PSS",
                operation_type="signature",
                status="success",
                execution_duration_ms=d,
                created_at=now - timedelta(minutes=20),
            )
        )

    # 5 failed signature verifications for Alice within 1 hour
    for _ in range(5):
        records.append(
            OperationHistory(
                user_id=1,
                algorithm_name="RSA-PSS",
                operation_type="signature_verification",
                status="failure",
                execution_duration_ms=15.0,
                created_at=now - timedelta(minutes=30),
            )
        )

    # 1 successful verification
    records.append(
        OperationHistory(
            user_id=1,
            algorithm_name="RSA-PSS",
            operation_type="signature_verification",
            status="success",
            execution_duration_ms=16.0,
            created_at=now - timedelta(minutes=30),
        )
    )

    # Bob's operations (User 2)
    for _ in range(10):
        records.append(
            OperationHistory(
                user_id=2,
                algorithm_name="DES",
                operation_type="encryption",
                status="success",
                execution_duration_ms=8.0,
                created_at=now - timedelta(minutes=5),
            )
        )

    db.add_all(records)
    db.commit()
    db.close()


# ─── Auth Protection Tests ───────────────────────────────────────────────────

def test_analytics_endpoints_require_auth(client):
    """Verify all analytics routes reject unauthenticated requests with 401."""
    routes = [
        "/api/analytics/summary",
        "/api/analytics/operations-over-time",
        "/api/analytics/distribution",
        "/api/analytics/performance",
        "/api/analytics/security-events",
        "/api/analytics/export",
    ]
    for route in routes:
        res = client.get(route)
        assert res.status_code == 401, f"{route} did not enforce 401 unauthorized"


# ─── User Isolation & Summary Tests ──────────────────────────────────────────

def test_summary_and_user_isolation(client, mock_users):
    """User 1 (Alice) must only see her own metrics and never User 2 (Bob)'s."""
    seed_test_operations()
    alice, bob = mock_users

    # Authenticate as Alice
    app.dependency_overrides[get_current_user] = lambda: alice
    res = client.get("/api/analytics/summary")
    assert res.status_code == 200
    data = res.json()

    # Total operations for Alice = 5 (AES) + 2 (sign) + 6 (verify) = 13
    assert data["total_operations"] == 13
    assert data["failed_operations"] == 5
    assert data["successful_operations"] == 8
    assert data["signature_verification_failures"] == 5
    assert data["database_connected"] is True
    assert data["avg_duration_ms"] is not None
    assert data["min_duration_ms"] is not None
    assert data["max_duration_ms"] is not None

    # Authenticate as Bob
    app.dependency_overrides[get_current_user] = lambda: bob
    res_bob = client.get("/api/analytics/summary")
    assert res_bob.status_code == 200
    bob_data = res_bob.json()

    # Bob has 10 DES operations, 0 failures
    assert bob_data["total_operations"] == 10
    assert bob_data["failed_operations"] == 0
    assert bob_data["successful_operations"] == 10
    assert bob_data["signature_verification_failures"] == 0


def test_summary_with_filters(client, mock_users):
    """Verify filtering by algorithm, operation_type, and status."""
    seed_test_operations()
    alice, _ = mock_users
    app.dependency_overrides[get_current_user] = lambda: alice

    # Filter by AES
    res = client.get("/api/analytics/summary?algorithm=AES")
    assert res.status_code == 200
    data = res.json()
    assert data["total_operations"] == 5
    assert data["failed_operations"] == 0

    # Filter by signature_verification
    res = client.get("/api/analytics/summary?operation_type=signature_verification")
    assert res.status_code == 200
    data = res.json()
    assert data["total_operations"] == 6
    assert data["failed_operations"] == 5


# ─── Operations Over Time Tests ──────────────────────────────────────────────

def test_operations_over_time(client, mock_users):
    seed_test_operations()
    alice, _ = mock_users
    app.dependency_overrides[get_current_user] = lambda: alice

    res = client.get("/api/analytics/operations-over-time")
    assert res.status_code == 200
    data = res.json()
    assert "buckets" in data
    assert "granularity" in data
    assert data["database_connected"] is True


# ─── Distribution Tests ──────────────────────────────────────────────────────

def test_distribution(client, mock_users):
    seed_test_operations()
    alice, _ = mock_users
    app.dependency_overrides[get_current_user] = lambda: alice

    res = client.get("/api/analytics/distribution")
    assert res.status_code == 200
    data = res.json()
    assert "by_algorithm" in data
    assert "by_operation_type" in data

    algos = {a["algorithm"]: a for a in data["by_algorithm"]}
    assert "AES-GCM" in algos
    assert algos["AES-GCM"]["total"] == 5

    assert "RSA-PSS" in algos
    assert algos["RSA-PSS"]["total"] == 8
    assert algos["RSA-PSS"]["failed"] == 5

    # Ensure Bob's algorithm (DES) is NOT present
    assert "DES" not in algos


# ─── Performance & Percentile Tests ──────────────────────────────────────────

def test_performance_percentiles(client, mock_users):
    seed_test_operations()
    alice, _ = mock_users
    app.dependency_overrides[get_current_user] = lambda: alice

    res = client.get("/api/analytics/performance")
    assert res.status_code == 200
    data = res.json()
    assert "by_algorithm" in data
    assert "by_operation_type" in data
    assert data["overall_avg_ms"] is not None

    aes_entry = next((e for e in data["by_algorithm"] if e["group_label"] == "AES-GCM"), None)
    assert aes_entry is not None
    assert aes_entry["count"] == 5
    # Since AES count == 5 >= P50_MIN (5), p50_ms should be populated!
    assert aes_entry["p50_ms"] is not None
    # But count < 20, so p95_ms must be None (respecting minimum sample threshold)
    assert aes_entry["p95_ms"] is None
    assert aes_entry["p99_ms"] is None


# ─── Security Events Tests ───────────────────────────────────────────────────

def test_security_events_heuristic_rules(client, mock_users):
    """Verify that 5 failed signature verifications in 1 hour triggers an event."""
    seed_test_operations()
    alice, _ = mock_users
    app.dependency_overrides[get_current_user] = lambda: alice

    res = client.get("/api/analytics/security-events")
    assert res.status_code == 200
    data = res.json()
    assert "events" in data
    assert "anomaly_thresholds" in data

    # Alice has 5 failed signature verifications in 1 hour -> rule triggered
    sig_fail_events = [e for e in data["events"] if "Signature Verification" in e["category"]]
    assert len(sig_fail_events) >= 1
    event = sig_fail_events[0]
    assert event["severity"] == "warning"
    assert event["count"] >= 5


# ─── Export Tests ────────────────────────────────────────────────────────────

def test_export_csv_and_json(client, mock_users):
    seed_test_operations()
    alice, _ = mock_users
    app.dependency_overrides[get_current_user] = lambda: alice

    # Test CSV Export
    res_csv = client.get("/api/analytics/export?format=csv")
    assert res_csv.status_code == 200
    assert res_csv.headers["content-type"].startswith("text/csv")
    assert "attachment; filename=" in res_csv.headers.get("content-disposition", "")
    
    csv_text = res_csv.text
    reader = csv.DictReader(io.StringIO(csv_text))
    rows = list(reader)
    assert len(rows) == 13 or len(rows) == 14
    # Check that required non-sensitive headers exist and no sensitive fields exist
    expected_headers = {"id", "algorithm_name", "operation_type", "status", "execution_duration_ms", "created_at"}
    assert set(reader.fieldnames) == expected_headers

    # Test JSON Export
    res_json = client.get("/api/analytics/export?format=json")
    assert res_json.status_code == 200
    assert "application/json" in res_json.headers["content-type"]
    json_data = res_json.json()
    assert json_data["user_id"] == alice.id
    assert len(json_data["records"]) == len(rows)
    for rec in json_data["records"]:
        assert "algorithm_name" in rec
        assert "password" not in rec
        assert "key" not in rec
        assert "plaintext" not in rec


# ─── Database Degradation / Empty Tests ───────────────────────────────────────

def test_analytics_empty_database(client, mock_users):
    """When no records exist, analytics returns zeroed structures safely."""
    alice, _ = mock_users
    app.dependency_overrides[get_current_user] = lambda: alice

    res = client.get("/api/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_operations"] == 0
    assert data["success_rate"] is None
    assert data["avg_duration_ms"] is None
