import os
from typing import List, Optional, Union
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SecureCipher"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api"
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # PostgreSQL Database URL
    # Format: postgresql+psycopg://username:password@localhost:5432/database_name
    DATABASE_URL: Optional[str] = None

    # Allowed CORS Origins for Vite frontend
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    # JWT Authentication Configuration
    JWT_SECRET_KEY: str = "securecipher_jwt_super_secret_signing_key_at_least_32_bytes_2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # SMTP Email Configuration (Optional - for real email verification)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_FROM_NAME: str = "SecureCipher Security"
    SMTP_TLS: bool = True

    # Maximum file size for file encryption / decryption and hashing (default: 50MB)
    MAX_FILE_SIZE_BYTES: int = 50 * 1024 * 1024

    # Environment
    ENVIRONMENT: str = "development"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v  # type: ignore
        raise ValueError(v)

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        env = self.ENVIRONMENT.lower()
        if env in ("production", "staging"):
            default_dev_secret = "securecipher_jwt_super_secret_signing_key_at_least_32_bytes_2026"
            if self.JWT_SECRET_KEY == default_dev_secret:
                raise ValueError(
                    "CRITICAL SECURITY CONFIGURATION ERROR: Default development JWT_SECRET_KEY detected in "
                    f"{env} environment! You must set a unique, cryptographically strong secret (32+ bytes)."
                )
            if len(self.JWT_SECRET_KEY.strip()) < 32:
                raise ValueError(
                    f"CRITICAL SECURITY CONFIGURATION ERROR: JWT_SECRET_KEY must be at least 32 characters in {env}."
                )
        return self

    @property
    def masked_database_url(self) -> str:
        """Returns the database URL with the password masked for safe diagnostic logging."""
        if not self.DATABASE_URL:
            return "Not configured"
        try:
            from urllib.parse import urlsplit, urlunsplit
            parsed = urlsplit(self.DATABASE_URL)
            if parsed.password:
                netloc = f"{parsed.username}:******@{parsed.hostname}"
                if parsed.port:
                    netloc += f":{parsed.port}"
                return urlunsplit((parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment))
            return self.DATABASE_URL
        except Exception:
            return "Configured (masked)"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
