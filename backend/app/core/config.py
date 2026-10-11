import os
from typing import List, Optional, Union
from pydantic import field_validator
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

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v  # type: ignore
        raise ValueError(v)

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
