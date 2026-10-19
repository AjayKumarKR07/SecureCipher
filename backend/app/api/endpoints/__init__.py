"""API endpoints package."""
from app.api.endpoints.health import router as health_router
from app.api.endpoints.algorithms import router as algorithms_router
from app.api.endpoints.history import router as history_router
from app.api.endpoints.aes import router as aes_router
from app.api.endpoints.rsa import router as rsa_router
from app.api.endpoints.diffie_hellman import router as diffie_hellman_router
from app.api.endpoints.sha256 import router as sha256_router
from app.api.endpoints.md5 import router as md5_router
from app.api.endpoints.des import router as des_router
from app.api.endpoints.auth import auth_router
from app.api.endpoints.rsa_pss import router as rsa_pss_router

__all__ = [
    "health_router",
    "algorithms_router",
    "history_router",
    "aes_router",
    "rsa_router",
    "diffie_hellman_router",
    "sha256_router",
    "md5_router",
    "des_router",
    "auth_router",
    "rsa_pss_router",
]


