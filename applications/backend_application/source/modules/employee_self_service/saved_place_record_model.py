"""SQLAlchemy model for employee saved commute places."""

from sqlalchemy import Float, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class SavedPlaceRecord(BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin):
    """A reusable pickup or destination saved by an employee."""

    __tablename__ = "saved_place_records"
    __table_args__ = (
        UniqueConstraint(
            "organization_id",
            "employee_id",
            "label",
            name="unique_saved_place_label_per_employee",
        ),
    )

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    employee_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("employee_records.id"), nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String(80), nullable=False)
    address_label: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
