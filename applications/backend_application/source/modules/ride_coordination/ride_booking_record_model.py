"""SQLAlchemy model for ride bookings (the match between request and offer)."""

from datetime import datetime

from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideBookingTripStatus,
)


class RideBookingRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """One passenger's confirmed seat on one driver's journey.

    Created atomically when a request is matched to an offer (either the
    passenger books an offer or the driver accepts a request). Carries the
    per-booking OTP and the trip lifecycle for that passenger.
    """

    __tablename__ = "ride_booking_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    ride_request_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ride_request_records.id"),
        nullable=False,
        unique=True,
        index=True,
    )
    ride_offer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ride_offer_records.id"), nullable=False, index=True
    )
    passenger_employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employee_records.id"), nullable=False, index=True
    )
    driver_employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employee_records.id"), nullable=False, index=True
    )

    seats_booked: Mapped[int] = mapped_column(Integer, nullable=False)
    fare_amount: Mapped[float] = mapped_column(Float, nullable=False)

    pickup_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    drop_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    drop_longitude: Mapped[float] = mapped_column(Float, nullable=False)

    otp_code: Mapped[str] = mapped_column(String(4), nullable=False)
    is_otp_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    trip_status: Mapped[str] = mapped_column(
        String(20),
        default=RideBookingTripStatus.BOOKED.value,
        nullable=False,
        index=True,
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
