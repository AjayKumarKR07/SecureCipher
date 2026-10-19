"""
Tests for Database URL Normalization and Deployment Readiness Configuration.
"""
import pytest
from app.core.config import normalize_database_url, Settings
from app.services.auth_service import request_registration_otp
from fastapi import HTTPException


def test_normalize_database_url_postgres_prefixes():
    """Verify standard cloud provider postgres URLs are converted to Psycopg 3 dialect."""
    raw_postgres = "postgres://usr_admin:p%40ssw0rd@ep-cool-db.us-east-1.render.com:5432/securecipher"
    expected = "postgresql+psycopg://usr_admin:p%40ssw0rd@ep-cool-db.us-east-1.render.com:5432/securecipher"
    assert normalize_database_url(raw_postgres) == expected

    raw_postgresql = "postgresql://usr_admin:secret@ep-cool-db.us-east-1.render.com:5432/securecipher"
    expected_sql = "postgresql+psycopg://usr_admin:secret@ep-cool-db.us-east-1.render.com:5432/securecipher"
    assert normalize_database_url(raw_postgresql) == expected_sql


def test_normalize_database_url_psycopg2_and_psycopg_dialects():
    """Verify psycopg2 dialect mappings are upgraded and existing psycopg3 URLs are untouched."""
    raw_psycopg2 = "postgresql+psycopg2://user:pass@localhost:5432/db"
    assert normalize_database_url(raw_psycopg2) == "postgresql+psycopg://user:pass@localhost:5432/db"

    raw_postgres_psycopg2 = "postgres+psycopg2://user:pass@localhost:5432/db"
    assert normalize_database_url(raw_postgres_psycopg2) == "postgresql+psycopg://user:pass@localhost:5432/db"

    raw_postgres_psycopg = "postgres+psycopg://user:pass@localhost:5432/db"
    assert normalize_database_url(raw_postgres_psycopg) == "postgresql+psycopg://user:pass@localhost:5432/db"

    # Already valid Psycopg 3
    valid_psycopg3 = "postgresql+psycopg://user:pass@localhost:5432/db"
    assert normalize_database_url(valid_psycopg3) == valid_psycopg3


def test_normalize_database_url_preserves_query_parameters():
    """Verify SSL and connection parameters are preserved after prefix normalization."""
    ssl_url = "postgres://admin:pass@host.region.render.com:5432/mydb?sslmode=require&connect_timeout=10"
    normalized = normalize_database_url(ssl_url)
    assert normalized == "postgresql+psycopg://admin:pass@host.region.render.com:5432/mydb?sslmode=require&connect_timeout=10"


def test_normalize_database_url_preserves_sqlite():
    """Verify SQLite URLs used by local test suites are preserved without alteration."""
    sqlite_memory = "sqlite:///:memory:"
    assert normalize_database_url(sqlite_memory) == sqlite_memory

    sqlite_file = "sqlite:///./test.db"
    assert normalize_database_url(sqlite_file) == sqlite_file

    sqlite_pysqlite = "sqlite+pysqlite:///./test.db"
    assert normalize_database_url(sqlite_pysqlite) == sqlite_pysqlite


def test_normalize_database_url_empty_and_none():
    """Verify empty, None, and whitespace strings return None safely."""
    assert normalize_database_url(None) is None
    assert normalize_database_url("") is None
    assert normalize_database_url("   ") is None


def test_settings_field_validator_auto_normalizes():
    """Verify Pydantic Settings automatically normalizes DATABASE_URL on load."""
    test_settings = Settings(
        DATABASE_URL="postgres://render_user:pass123@dpg-xxx.oregon-postgres.render.com/securecipher_db"
    )
    assert test_settings.DATABASE_URL == "postgresql+psycopg://render_user:pass123@dpg-xxx.oregon-postgres.render.com/securecipher_db"
    # Ensure masked URL conceals the secret password
    masked = test_settings.masked_database_url
    assert "pass123" not in masked
    assert "******" in masked


def test_staging_mode_suppresses_dev_otp_like_production(monkeypatch):
    """Verify that staging mode does not leak dev OTP if SMTP is unconfigured."""
    from app.core.config import settings

    monkeypatch.setattr(settings, "ENVIRONMENT", "staging")
    monkeypatch.setattr(settings, "SMTP_HOST", None)

    class DummyDB:
        def query(self, *args, **kwargs):
            class QueryMock:
                def filter(self, *f_args, **f_kwargs):
                    return self
                def order_by(self, *o_args, **o_kwargs):
                    return self
                def first(self):
                    return None
            return QueryMock()
        def add(self, obj): pass
        def commit(self): pass

    with pytest.raises(HTTPException) as exc_info:
        request_registration_otp(
            db=DummyDB(),
            full_name="Staging User",
            email="staging_tester@securecipher.org",
            password="StrongPassword#2026",
        )
    assert exc_info.value.status_code == 503
    assert "temporarily unavailable" in exc_info.value.detail.lower()
