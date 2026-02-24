"""Application settings loaded from environment / .env file."""

from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/tryonai"

    # Storage
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 10
    allowed_extensions: List[str] = ["jpg", "jpeg", "png", "webp"]

    # Session lifecycle
    session_expiry_hours: int = 24
    cleanup_interval_hours: int = 1

    # Mock AI processing
    mock_ai_processing_seconds: int = 3
    mock_ai_failure_rate: float = 0.1

    # Security
    rate_limit_per_minute: int = 10

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
