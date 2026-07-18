"""SQLAlchemy model for user account records (admins and employees)."""

from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class UserAccountRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """Represents an authenticated user account.

    Supports multiple roles: SUPER_ADMIN, COMPANY_ADMIN, EMPLOYEE.
    Linked to an organization for tenant isolation.
    """

    __tablename__ = "user_account_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
