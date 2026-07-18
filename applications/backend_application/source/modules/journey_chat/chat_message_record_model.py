"""SQLAlchemy model for journey chat messages."""

from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from source.shared_infrastructure.base_database_model import (
    BaseDatabaseModel,
    OrganizationTenantMixin,
    TimestampMixin,
    generate_unique_identifier,
)


class ChatMessageRecord(
    BaseDatabaseModel, OrganizationTenantMixin, TimestampMixin
):
    """One text message in a journey's group conversation.

    The conversation is identified by ``ride_offer_id``; ``created_at`` from the
    timestamp mixin orders the transcript.
    """

    __tablename__ = "chat_message_records"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=generate_unique_identifier
    )
    ride_offer_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("ride_offer_records.id"),
        nullable=False,
        index=True,
    )
    sender_employee_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("employee_records.id"),
        nullable=False,
        index=True,
    )
    body: Mapped[str] = mapped_column(String(2000), nullable=False)
