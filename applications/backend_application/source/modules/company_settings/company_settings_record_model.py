"""SQLAlchemy model for company settings records."""

from sqlalchemy import String, Float
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class CompanySettingsRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """Stores per-organization configuration for carpooling operations."""

    __tablename__ = "company_settings_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    fuel_cost_per_liter: Mapped[float] = mapped_column(
        Float, default=100.0, nullable=False
    )
    travel_cost_per_kilometer: Mapped[float] = mapped_column(
        Float, default=12.0, nullable=False
    )
    office_latitude: Mapped[float] = mapped_column(Float, default=28.6139, nullable=False)
    office_longitude: Mapped[float] = mapped_column(Float, default=77.2090, nullable=False)
    ride_radius_kilometers: Mapped[float] = mapped_column(
        Float, default=25.0, nullable=False
    )
    default_currency: Mapped[str] = mapped_column(
        String(10), default="INR", nullable=False
    )
    company_logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
