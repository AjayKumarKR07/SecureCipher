import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.db.session import get_engine, Base
from app.db.init_db import init_db
from app.api.router import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("securecipher")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Initializes database tables on startup if database is reachable.
    """
    logger.info("Starting up %s v%s...", settings.PROJECT_NAME, settings.VERSION)
    logger.info("Configured Database: %s", settings.masked_database_url)
    
    # Attempt table creation if database is configured
    if settings.DATABASE_URL:
        try:
            init_db()
        except Exception as e:
            logger.warning("Auto table initialization skipped: %s", str(e))
    else:
        logger.info("DATABASE_URL not set. Running in decoupled mode until configured in backend/.env.")

    yield

    logger.info("Shutting down %s...", settings.PROJECT_NAME)


app = FastAPI(
    title=f"{settings.PROJECT_NAME} – Multi-Algorithm Cryptography API",
    description="Backend API foundation for SecureCipher, providing health telemetry, algorithm specifications, and audit logs.",
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global secure exception handler to prevent leaking internal traces or credentials
@app.exception_handler(Exception)
async def secure_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception processing %s %s: %s", request.method, request.url.path, str(exc))
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "message": "An unexpected internal server error occurred. Please consult backend logs.",
        },
    )


# Mount the API router at /api
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root_info():
    """SecureCipher Root Information."""
    return {
        "service": settings.PROJECT_NAME,
        "description": "Multi-Algorithm Cryptography and Secure Data Protection System",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_health": f"{settings.API_V1_STR}/health",
        "api_database": f"{settings.API_V1_STR}/health/database",
        "api_algorithms": f"{settings.API_V1_STR}/algorithms",
        "api_history": f"{settings.API_V1_STR}/history",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
