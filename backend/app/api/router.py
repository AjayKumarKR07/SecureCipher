from fastapi import APIRouter
from app.api.endpoints import (
    health_router,
    algorithms_router,
    history_router,
    aes_router,
    rsa_router,
    diffie_hellman_router,
    sha256_router,
    md5_router,
    des_router,
    auth_router,
)

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(algorithms_router)
api_router.include_router(history_router)
api_router.include_router(auth_router)
api_router.include_router(aes_router)
api_router.include_router(rsa_router)
api_router.include_router(diffie_hellman_router)
api_router.include_router(sha256_router)
api_router.include_router(md5_router)
api_router.include_router(des_router)


