"""SQLAlchemy model for live location pings during an active journey."""

from datetime import datetime, timezone

from sqlalchemy import String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class LiveLocationPingRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """A single GPS sample posted by a driver while a journey is active.

    Passengers poll the latest ping for their booking's offer to render
    the live map. Pings are only accepted while the journey is STARTED.
    """

    __tablename__ = "live_location_ping_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    ride_offer_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("ride_offer_records.id"), nullable=False, index=True
    )
    driver_employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employee_records.id"), nullable=False
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )
