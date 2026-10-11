"""API endpoints package."""
from app.api.endpoints.health import router as health_router
from app.api.endpoints.algorithms import router as algorithms_router
from app.api.endpoints.history import router as history_router

__all__ = ["health_router", "algorithms_router", "history_router"]
