"""Standardized pagination contracts for list endpoints."""

from pydantic import BaseModel, Field
from typing import TypeVar, Generic, List

DataItemType = TypeVar("DataItemType")


class PaginatedRequestParameters(BaseModel):
    """Query parameters for paginated list requests."""

    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(
        default=20, ge=1, le=100, description="Number of items per page"
    )
    search_query: str = Field(
        default="", description="Optional search text to filter results"
    )


class PaginatedResponse(BaseModel, Generic[DataItemType]):
    """Standardized paginated response wrapper."""

    items: List[DataItemType]
    total_count: int
    page: int
    page_size: int
    total_pages: int
