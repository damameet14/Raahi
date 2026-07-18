"""SQLAlchemy model for vehicle records."""

from sqlalchemy import String, Integer, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class VehicleRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """Represents a registered vehicle available for carpooling."""

    __tablename__ = "vehicle_records"
    __table_args__ = (
        # Vehicle numbers are unique within an organization, not globally,
        # since employees self-register their own vehicles per company.
        UniqueConstraint(
            "organization_id",
            "vehicle_number",
            name="unique_vehicle_number_per_organization",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    vehicle_number: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employee_records.id"), nullable=False
    )
    make: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    capacity: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    fuel_type: Mapped[str] = mapped_column(
        String(20), default="PETROL", nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="ACTIVE", nullable=False
    )
    insurance_expiry_date: Mapped[date | None] = mapped_column(Date, nullable=True)
