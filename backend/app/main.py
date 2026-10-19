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
    Validates required security configuration and initializes database tables on startup.
    """
    logger.info("Starting up %s v%s [Environment: %s]...", settings.PROJECT_NAME, settings.VERSION, settings.ENVIRONMENT)
    logger.info("Configured Database: %s", settings.masked_database_url)

    # Security validation for production deployments
    if settings.ENVIRONMENT.lower() == "production":
        if settings.JWT_SECRET_KEY == "securecipher_jwt_super_secret_signing_key_at_least_32_bytes_2026":
            raise RuntimeError(
                "CRITICAL SECURITY CONFIGURATION ERROR: Default development JWT_SECRET_KEY detected in production environment! "
                "You must set a unique, cryptographically strong secret (32+ bytes) in production environment variables."
            )
        if len(settings.JWT_SECRET_KEY.strip()) < 32:
            raise RuntimeError("CRITICAL SECURITY ERROR: JWT_SECRET_KEY must be at least 32 characters in production.")
    
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
    docs_url="/docs" if settings.ENVIRONMENT.lower() != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT.lower() != "production" else None,
    openapi_url="/openapi.json" if settings.ENVIRONMENT.lower() != "production" else None,
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
        "docs_url": "/docs" if settings.ENVIRONMENT.lower() != "production" else None,
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
