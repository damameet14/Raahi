"""SQLAlchemy model for per-employee wallet balances."""

from sqlalchemy import Float, String, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class WalletRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """One employee's spendable balance within an organization.

    The balance is the source of truth; the transaction ledger records how it
    reached its current value. Exactly one wallet exists per employee.
    """

    __tablename__ = "wallet_records"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "employee_id",
            name="uq_wallet_record_employee",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    employee_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("employee_records.id"),
        nullable=False,
        index=True,
    )
    balance_amount: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False
    )
    currency: Mapped[str] = mapped_column(
        String(10), default="INR", nullable=False
    )
