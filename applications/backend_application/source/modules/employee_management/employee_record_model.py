"""SQLAlchemy model for employee records."""

from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class EmployeeRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """Represents an employee within an organization.

    Linked to a user_account for authentication purposes (optional
    until the employee activates their account).
    """

    __tablename__ = "employee_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    user_account_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("user_account_records.id"), nullable=True
    )
    employee_code: Mapped[str] = mapped_column(String(50), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    designation: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="ACTIVE", nullable=False
    )
    home_latitude: Mapped[float | None] = mapped_column(nullable=True)
    home_longitude: Mapped[float | None] = mapped_column(nullable=True)
    is_driver: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
