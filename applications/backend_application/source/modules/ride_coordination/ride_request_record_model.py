"""SQLAlchemy model for passenger ride requests (Find a Ride)."""

from datetime import date

from sqlalchemy import String, Integer, Float, Boolean, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)
from source.modules.ride_coordination.ride_status_definitions import RideRequestStatus


class RideRequestRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """A passenger's request to travel from a source to a destination.

    A request is fulfilled by exactly one booking. Recurrence stores the
    schedule only; a single upcoming occurrence is materialized as a
    request at a time.
    """

    __tablename__ = "ride_request_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    passenger_employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employee_records.id"), nullable=False, index=True
    )

    source_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    source_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    source_label: Mapped[str | None] = mapped_column(String(500), nullable=True)
    destination_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    destination_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    destination_label: Mapped[str | None] = mapped_column(String(500), nullable=True)

    travel_date: Mapped[date] = mapped_column(Date, nullable=False)
    departure_time: Mapped[str] = mapped_column(String(5), nullable=False)  # "HH:MM"
    seats_requested: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    recurrence_days: Mapped[str | None] = mapped_column(String(50), nullable=True)
    recurrence_time: Mapped[str | None] = mapped_column(String(5), nullable=True)

    estimated_distance_kilometers: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )
    estimated_fare_amount: Mapped[float | None] = mapped_column(Float, nullable=True)

    status: Mapped[str] = mapped_column(
        String(20), default=RideRequestStatus.PENDING.value, nullable=False, index=True
    )
