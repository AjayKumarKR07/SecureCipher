import logging
import sys
from app.db.session import Base, get_engine
from app.models.history import OperationHistory

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def init_db() -> bool:
    """Creates database tables if they do not exist."""
    engine = get_engine()
    if engine is None:
        logger.warning("DATABASE_URL is not configured or engine could not be created. Skipping table initialization.")
        return False
    try:
        logger.info("Initializing database schema...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
        return True
    except Exception as e:
        logger.error("Failed to initialize database tables: %s", str(e))
        return False


if __name__ == "__main__":
    success = init_db()
    sys.exit(0 if success else 1)
