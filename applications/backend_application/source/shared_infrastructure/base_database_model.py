"""Base SQLAlchemy model and multi-tenant mixin for all database records."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class BaseDatabaseModel(DeclarativeBase):
    """Abstract base for all SQLAlchemy models in the application."""
    pass


class OrganizationTenantMixin:
    """Mixin that adds organization_id to any model for multi-tenancy.

    Every major business table should include this mixin so that
    data is always scoped to an organization.
    """

    organization_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("organization_records.id"),
        nullable=False,
        index=True,
    )


class TimestampMixin:
    """Mixin that adds created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


def generate_unique_identifier() -> str:
    """Generate a new UUID4 string for use as a primary key."""
    return str(uuid.uuid4())
