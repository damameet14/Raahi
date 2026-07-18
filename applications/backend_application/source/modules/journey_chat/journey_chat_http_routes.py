"""WebSocket and REST routes for journey chat.

The WebSocket carries the access token as a query parameter (browsers cannot set
Authorization headers on a WebSocket handshake). Both the socket and the history
endpoint require the caller to be a member of the journey's chat.
"""

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from pydantic import ValidationError
from sqlalchemy.orm import Session

from source.application_startup.database_connection import (
    get_database_session,
    open_database_session,
)
from source.modules.employee_management.current_employee_http_dependency import (
    resolve_current_employee,
)
from source.modules.employee_management.employee_record_model import EmployeeRecord
from source.modules.employee_management.public_interface import (
    retrieve_employee_for_user_account,
)
from source.modules.journey_chat.journey_chat_connection_manager import (
    journey_chat_connection_manager,
)
from source.modules.journey_chat.journey_chat_contracts import (
    ChatMessageResponse,
    IncomingChatMessage,
)
from source.modules.journey_chat.journey_chat_service import (
    build_chat_message_response,
    is_employee_journey_chat_member,
    list_journey_messages,
    persist_chat_message,
)
from source.shared_infrastructure.current_authenticated_user_dependency import (
    decode_access_token_or_none,
)

_WEBSOCKET_CLOSE_UNAUTHENTICATED = 4401
_WEBSOCKET_CLOSE_FORBIDDEN = 4403

journey_chat_router = APIRouter(tags=["Journey Chat"])


@journey_chat_router.get(
    "/api/v1/journeys/{ride_offer_id}/messages",
    response_model=list[ChatMessageResponse],
    summary="Chat history for a journey",
)
def get_journey_messages(
    ride_offer_id: str,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return the transcript for a journey the caller participates in."""
    if not is_employee_journey_chat_member(
        database_session,
        organization_id=employee.organization_id,
        ride_offer_id=ride_offer_id,
        employee_id=employee.id,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not part of this journey's chat",
        )
    return list_journey_messages(
        database_session,
        organization_id=employee.organization_id,
        ride_offer_id=ride_offer_id,
    )


@journey_chat_router.websocket("/api/v1/ws/journeys/{ride_offer_id}/chat")
async def journey_chat_websocket(
    websocket: WebSocket,
    ride_offer_id: str,
    token: str = Query(default=""),
):
    """Live group chat socket for a journey's driver and passengers."""
    authenticated_user = decode_access_token_or_none(token)
    if authenticated_user is None:
        await websocket.close(code=_WEBSOCKET_CLOSE_UNAUTHENTICATED)
        return

    with open_database_session() as database_session:
        employee = retrieve_employee_for_user_account(
            database_session=database_session,
            user_account_id=authenticated_user.user_account_id,
            organization_id=authenticated_user.organization_id,
        )
        is_member = employee is not None and is_employee_journey_chat_member(
            database_session,
            organization_id=authenticated_user.organization_id,
            ride_offer_id=ride_offer_id,
            employee_id=employee.id,
        )
    if not is_member:
        await websocket.close(code=_WEBSOCKET_CLOSE_FORBIDDEN)
        return

    organization_id = employee.organization_id
    sender_employee_id = employee.id
    await journey_chat_connection_manager.connect(ride_offer_id, websocket)
    try:
        while True:
            raw_message = await websocket.receive_json()
            body = _extract_message_body(raw_message)
            if body is None:
                continue
            with open_database_session() as database_session:
                message = persist_chat_message(
                    database_session,
                    organization_id=organization_id,
                    ride_offer_id=ride_offer_id,
                    sender_employee_id=sender_employee_id,
                    body=body,
                )
                message_response = build_chat_message_response(
                    database_session,
                    organization_id=organization_id,
                    message=message,
                )
            await journey_chat_connection_manager.broadcast(
                ride_offer_id, message_response.model_dump(mode="json")
            )
    except WebSocketDisconnect:
        journey_chat_connection_manager.disconnect(ride_offer_id, websocket)


def _extract_message_body(raw_message: object) -> str | None:
    """Validate and normalize an inbound message body, or return None."""
    try:
        incoming = IncomingChatMessage.model_validate(raw_message)
    except ValidationError:
        return None
    trimmed_body = incoming.body.strip()
    return trimmed_body or None
