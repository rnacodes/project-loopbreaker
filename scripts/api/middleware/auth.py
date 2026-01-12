"""API key authentication middleware."""

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

from ..config import settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)) -> None:
    """
    Verify the API key from request header.

    If no API key is configured in settings, authentication is disabled.
    """
    if not settings.api_key:
        # No API key configured - allow all requests
        return

    if not api_key:
        raise HTTPException(
            status_code=401,
            detail="Missing API key. Provide X-API-Key header."
        )

    if api_key != settings.api_key:
        raise HTTPException(
            status_code=401,
            detail="Invalid API key"
        )
