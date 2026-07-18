"""Business logic for journey chat: membership, persistence, and history.

Membership on a journey's chat is the driver plus every passenger holding a
non-cancelled booking on that ride offer. Only members may read history or send
messages.
"""

from sqlalchemy.orm import Session

from source.modules.employee_management.public_interface import (
    retrieve_employee_by_id_within_organization,
)
from source.modules.journey_chat.chat_message_record_model import (
    ChatMessageRecord,
)
from source.modules.journey_chat.journey_chat_contracts import (
    ChatMessageResponse,
)
from source.modules.ride_coordination.ride_booking_record_model import (
    RideBookingRecord,
)
from source.modules.ride_coordination.ride_offer_record_model import (
    RideOfferRecord,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideBookingTripStatus,
)

_UNKNOWN_SENDER_NAME = "Unknown"


def resolve_journey_chat_member_ids(
    database_session: Session,
    *,
    organization_id: str,
    ride_offer_id: str,
) -> set[str]:
    """Return the employee ids allowed in a journey's chat.

    Empty when the offer does not exist in the organization. Otherwise the
    driver plus every passenger whose booking is not cancelled.
    """
    ride_offer = (
        database_session.query(RideOfferRecord)
        .filter(
            RideOfferRecord.id == ride_offer_id,
            RideOfferRecord.organization_id == organization_id,
        )
        .first()
    )
    if ride_offer is None:
        return set()

    member_ids = {ride_offer.driver_employee_id}
    passenger_bookings = (
        database_session.query(RideBookingRecord)
        .filter(
            RideBookingRecord.ride_offer_id == ride_offer_id,
            RideBookingRecord.trip_status
            != RideBookingTripStatus.CANCELLED.value,
        )
        .all()
    )
    for booking in passenger_bookings:
        member_ids.add(booking.passenger_employee_id)
    return member_ids


def is_employee_journey_chat_member(
    database_session: Session,
    *,
    organization_id: str,
    ride_offer_id: str,
    employee_id: str,
) -> bool:
    """Report whether an employee may participate in a journey's chat."""
    return employee_id in resolve_journey_chat_member_ids(
        database_session,
        organization_id=organization_id,
        ride_offer_id=ride_offer_id,
    )


def persist_chat_message(
    database_session: Session,
    *,
    organization_id: str,
    ride_offer_id: str,
    sender_employee_id: str,
    body: str,
) -> ChatMessageRecord:
    """Persist one chat message and return the stored record."""
    message = ChatMessageRecord(
        organization_id=organization_id,
        ride_offer_id=ride_offer_id,
        sender_employee_id=sender_employee_id,
        body=body,
    )
    database_session.add(message)
    database_session.commit()
    database_session.refresh(message)
    return message


def list_journey_messages(
    database_session: Session,
    *,
    organization_id: str,
    ride_offer_id: str,
) -> list[ChatMessageResponse]:
    """Return a journey's transcript in chronological order."""
    messages = (
        database_session.query(ChatMessageRecord)
        .filter(
            ChatMessageRecord.organization_id == organization_id,
            ChatMessageRecord.ride_offer_id == ride_offer_id,
        )
        .order_by(ChatMessageRecord.created_at.asc())
        .all()
    )
    sender_name_by_id = _resolve_sender_names(
        database_session,
        organization_id=organization_id,
        sender_ids={message.sender_employee_id for message in messages},
    )
    return [
        _build_chat_message_response(message, sender_name_by_id)
        for message in messages
    ]


def build_chat_message_response(
    database_session: Session,
    *,
    organization_id: str,
    message: ChatMessageRecord,
) -> ChatMessageResponse:
    """Build the public response for a single freshly persisted message."""
    sender_name_by_id = _resolve_sender_names(
        database_session,
        organization_id=organization_id,
        sender_ids={message.sender_employee_id},
    )
    return _build_chat_message_response(message, sender_name_by_id)


def _resolve_sender_names(
    database_session: Session,
    *,
    organization_id: str,
    sender_ids: set[str],
) -> dict[str, str]:
    """Map sender employee ids to their display names."""
    sender_name_by_id: dict[str, str] = {}
    for sender_id in sender_ids:
        employee = retrieve_employee_by_id_within_organization(
            database_session=database_session,
            employee_id=sender_id,
            organization_id=organization_id,
        )
        sender_name_by_id[sender_id] = (
            employee.full_name if employee else _UNKNOWN_SENDER_NAME
        )
    return sender_name_by_id


def _build_chat_message_response(
    message: ChatMessageRecord,
    sender_name_by_id: dict[str, str],
) -> ChatMessageResponse:
    """Convert a record into its public contract using resolved names."""
    return ChatMessageResponse(
        id=message.id,
        ride_offer_id=message.ride_offer_id,
        sender_employee_id=message.sender_employee_id,
        sender_full_name=sender_name_by_id.get(
            message.sender_employee_id, _UNKNOWN_SENDER_NAME
        ),
        body=message.body,
        created_at=message.created_at,
    )
