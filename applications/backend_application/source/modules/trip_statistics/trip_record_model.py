"""SQLAlchemy model for trip records."""

from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class TripRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """Represents a completed or ongoing carpooling trip."""

    __tablename__ = "trip_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    driver_employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employee_records.id"), nullable=False
    )
    vehicle_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("vehicle_records.id"), nullable=False
    )
    start_location_name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    start_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    end_location_name: Mapped[str] = mapped_column(String(255), nullable=False)
    end_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    end_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    distance_kilometers: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    fuel_consumed_liters: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    trip_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    passenger_count: Mapped[int] = mapped_column(default=1, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="COMPLETED", nullable=False
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
