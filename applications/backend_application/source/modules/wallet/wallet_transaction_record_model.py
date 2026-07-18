"""SQLAlchemy model for the append-only wallet transaction ledger."""

from datetime import datetime

from sqlalchemy import DateTime, Float, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class WalletTransactionRecord(
    BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin
):
    """One ledger entry describing a single change to a wallet balance.

    ``amount`` is always the positive magnitude; ``direction`` records whether
    it credited or debited the wallet. ``balance_after`` snapshots the wallet
    balance once the entry completed (null while a recharge is still pending).
    """

    __tablename__ = "wallet_transaction_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    wallet_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("wallet_records.id"),
        nullable=False,
        index=True,
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), nullable=False, index=True
    )
    transaction_type: Mapped[str] = mapped_column(String(30), nullable=False)
    direction: Mapped[str] = mapped_column(String(10), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    balance_after: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default="COMPLETED", nullable=False
    )
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    razorpay_order_id: Mapped[str | None] = mapped_column(
        String(100), index=True, nullable=True
    )
    razorpay_payment_id: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
