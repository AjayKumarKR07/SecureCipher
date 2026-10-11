from fastapi import APIRouter
from app.api.endpoints import health_router, algorithms_router, history_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(algorithms_router)
api_router.include_router(history_router)
