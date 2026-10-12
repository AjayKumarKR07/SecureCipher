"""API endpoints package."""
from app.api.endpoints.health import router as health_router
from app.api.endpoints.algorithms import router as algorithms_router
from app.api.endpoints.history import router as history_router
from app.api.endpoints.aes import router as aes_router
from app.api.endpoints.rsa import router as rsa_router
from app.api.endpoints.diffie_hellman import router as diffie_hellman_router

__all__ = [
    "health_router",
    "algorithms_router",
    "history_router",
    "aes_router",
    "rsa_router",
    "diffie_hellman_router",
]


