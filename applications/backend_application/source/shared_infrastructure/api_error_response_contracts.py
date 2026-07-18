"""Standardized API error response shapes."""

from pydantic import BaseModel


class APIErrorResponse(BaseModel):
    """Consistent error response returned by all API endpoints."""

    error_code: str
    error_message: str
    detail: str | None = None
