import logging
import time
from typing import Generator, Optional, Tuple, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session, DeclarativeBase
from app.core.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """SQLAlchemy 2.x Declarative Base."""
    pass


_engine = None
_SessionLocal = None


def get_engine():
    global _engine
    if _engine is None and settings.DATABASE_URL:
        try:
            # Psycopg 3 engine with pool pre-ping
            _engine = create_engine(
                settings.DATABASE_URL,
                pool_pre_ping=True,
                echo=False,
                future=True,
            )
        except Exception as e:
            logger.error("Failed to initialize database engine: %s", str(e))
            _engine = None
    return _engine


def get_session_factory():
    global _SessionLocal
    engine = get_engine()
    if engine is not None and _SessionLocal is None:
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, future=True)
    return _SessionLocal


# Convenience alias
engine = property(lambda self: get_engine())


def SessionLocal() -> Optional[Session]:
    factory = get_session_factory()
    if factory is not None:
        return factory()
    return None


def get_db() -> Generator[Optional[Session], None, None]:
    """FastAPI Dependency providing a database session if configured."""
    factory = get_session_factory()
    if factory is None:
        yield None
        return

    db = factory()
    try:
        yield db
    finally:
        db.close()


def check_database_connection() -> Dict[str, Any]:
    """
    Safely tests database connectivity.
    Does NOT return internal exceptions or credentials.
    """
    if not settings.DATABASE_URL:
        return {
            "status": "unconfigured",
            "connected": False,
            "message": "DATABASE_URL is not configured in backend/.env",
            "database": None,
            "latency_ms": None,
        }

    eng = get_engine()
    if eng is None:
        return {
            "status": "error",
            "connected": False,
            "message": "Could not create database engine with provided configuration",
            "database": None,
            "latency_ms": None,
        }

    start_time = time.perf_counter()
    try:
        with eng.connect() as conn:
            result = conn.execute(text("SELECT current_database(), current_user, version();")).fetchone()
            latency = round((time.perf_counter() - start_time) * 1000, 2)
            db_name = result[0] if result else "unknown"
            user_name = result[1] if result else "unknown"
            return {
                "status": "connected",
                "connected": True,
                "message": "Successfully connected to PostgreSQL",
                "database": db_name,
                "user": user_name,
                "latency_ms": latency,
            }
    except Exception as e:
        logger.warning("Database connection test failed: %s", str(e))
        return {
            "status": "disconnected",
            "connected": False,
            "message": "Failed to connect to PostgreSQL server. Please check credentials and service status.",
            "database": None,
            "latency_ms": None,
        }
