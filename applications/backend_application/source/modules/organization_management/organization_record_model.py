"""SQLAlchemy model for organization records."""

from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    TimestampMixin,
    generate_unique_identifier,
)


class OrganizationRecord(BaseDatabaseModel, TimestampMixin):
    """Represents a company/organization in the multi-tenant platform."""

    __tablename__ = "organization_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    # The verified email domain (e.g. "acme.com"). Only employees whose login
    # email belongs to this domain may be provisioned and sign in.
    email_domain: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True
    )
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Onboarding lifecycle: PENDING → APPROVED / REJECTED. A company's admin
    # cannot sign in until a Raahi super-admin approves the organization.
    approval_status: Mapped[str] = mapped_column(
        String(20), default="PENDING", nullable=False
    )
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
