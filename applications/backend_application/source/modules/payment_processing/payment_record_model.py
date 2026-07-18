"""SQLAlchemy model for ride-booking fare payment records."""

from datetime import datetime

from sqlalchemy import DateTime, Float, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class PaymentRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """Stores the fare payment state for one completed ride booking.

    ``activity_type`` is always ``ride_booking`` today; keeping the generic
    ``activity_id`` / ``activity_type`` pair lets other payable activities reuse
    this table later without a schema change. One payment exists per activity.
    """

    __tablename__ = "payment_records"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "activity_id",
            "activity_type",
            name="uq_payment_record_activity",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    activity_type: Mapped[str] = mapped_column(
        String(50), default="ride_booking", nullable=False
    )
    activity_id: Mapped[str] = mapped_column(
        String(36), index=True, nullable=False
    )
    payer_employee_id: Mapped[str] = mapped_column(
        String(36), index=True, nullable=False
    )
    payee_employee_id: Mapped[str] = mapped_column(
        String(36), index=True, nullable=False
    )
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(
        String(10), default="INR", nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(20), default="PENDING", nullable=False, index=True
    )
    razorpay_order_id: Mapped[str | None] = mapped_column(
        String(100), index=True, nullable=True
    )
    razorpay_payment_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    razorpay_signature_reference: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    failure_reason: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
