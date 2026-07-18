"""SQLAlchemy model for driver ride offers (Offer a Ride)."""

from datetime import date

from sqlalchemy import String, Integer, Float, Boolean, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideOfferJourneyStatus,
)


class RideOfferRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """A driver's published journey with available seats and a time window.

    Publishing an offer commits its seats: bookings decrement
    seats_available, and the journey drives the live-tracking lifecycle.
    """

    __tablename__ = "ride_offer_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    driver_employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employee_records.id"), nullable=False, index=True
    )
    vehicle_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("vehicle_records.id"), nullable=False
    )

    source_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    source_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    source_label: Mapped[str | None] = mapped_column(String(500), nullable=True)
    destination_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    destination_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    destination_label: Mapped[str | None] = mapped_column(String(500), nullable=True)

    travel_date: Mapped[date] = mapped_column(Date, nullable=False)
    departure_window_start_time: Mapped[str] = mapped_column(String(5), nullable=False)
    departure_window_end_time: Mapped[str] = mapped_column(String(5), nullable=False)

    seats_total: Mapped[int] = mapped_column(Integer, nullable=False)
    seats_available: Mapped[int] = mapped_column(Integer, nullable=False)

    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    recurrence_days: Mapped[str | None] = mapped_column(String(50), nullable=True)
    recurrence_time: Mapped[str | None] = mapped_column(String(5), nullable=True)

    journey_status: Mapped[str] = mapped_column(
        String(20),
        default=RideOfferJourneyStatus.OPEN.value,
        nullable=False,
        index=True,
    )
