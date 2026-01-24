"""Configuration management for Script Runner API."""

import os
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class Settings:
    """Application settings loaded from environment variables."""

    # Database
    database_url: str = ""

    # API Security
    api_key: Optional[str] = None

    # CORS
    allowed_origins: List[str] = None

    # AI Settings (for vault standardization)
    # Uses same env vars as .NET backend: GRADIENT_API_KEY, GRADIENT_BASE_URL, GRADIENT_GENERATION_MODEL
    gradient_api_key: Optional[str] = None
    gradient_base_url: str = "https://api.gradient.ai/v1"
    ai_model: str = "llama-3.1-8b-instruct"  # Overridden by AI_MODEL or GRADIENT_GENERATION_MODEL env var

    # Job settings
    max_concurrent_jobs: int = 2

    def __post_init__(self):
        if self.allowed_origins is None:
            self.allowed_origins = ["http://localhost:5173", "http://localhost:5033"]


def load_settings() -> Settings:
    """Load settings from environment variables."""
    allowed_origins_str = os.environ.get("ALLOWED_ORIGINS", "")
    allowed_origins = [
        origin.strip()
        for origin in allowed_origins_str.split(",")
        if origin.strip()
    ] if allowed_origins_str else None

    return Settings(
        database_url=os.environ.get("DATABASE_URL", ""),
        api_key=os.environ.get("SCRIPT_RUNNER_API_KEY"),
        allowed_origins=allowed_origins,
        gradient_api_key=os.environ.get("GRADIENT_API_KEY"),
        gradient_base_url=os.environ.get("GRADIENT_BASE_URL", "https://api.gradient.ai/v1"),
        # Check both AI_MODEL (legacy) and GRADIENT_GENERATION_MODEL (matches .NET backend)
        ai_model=os.environ.get("AI_MODEL") or os.environ.get("GRADIENT_GENERATION_MODEL") or "llama-3.1-8b-instruct",
        max_concurrent_jobs=int(os.environ.get("MAX_CONCURRENT_JOBS", "2")),
    )


settings = load_settings()
