"""SQLAlchemy model for employee completed-activity payment records."""

from datetime import datetime

from sqlalchemy import DateTime, Float, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class PaymentRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """Stores payment state for one employee completed activity."""

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
    employee_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    activity_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    activity_type: Mapped[str] = mapped_column(String(50), default="trip", nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)
    razorpay_order_id: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    razorpay_signature_reference: Mapped[str | None] = mapped_column(String(20), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    payment_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

