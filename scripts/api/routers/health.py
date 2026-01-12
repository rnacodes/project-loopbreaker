"""Health check endpoints."""

from fastapi import APIRouter

from ..config import settings
from ..models import HealthResponse

router = APIRouter()


@router.get("", response_model=HealthResponse)
@router.get("/", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Check service health.

    Returns basic health status and optionally checks database connectivity.
    """
    db_connected = False

    # Try to connect to database if URL is configured
    if settings.database_url:
        try:
            import psycopg2
            conn = psycopg2.connect(settings.database_url)
            conn.close()
            db_connected = True
        except Exception:
            db_connected = False

    return HealthResponse(
        status="healthy",
        service="script_runner",
        version="1.0.0",
        database_connected=db_connected
    )
