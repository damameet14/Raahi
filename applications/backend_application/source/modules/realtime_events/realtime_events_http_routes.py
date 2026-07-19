"""WebSocket route for per-employee real-time ride events.

The socket carries the access token as a query parameter (browsers cannot set
Authorization headers on a WebSocket handshake). Once authenticated it joins the
employee's personal room and receives ride-lifecycle events pushed by the ride
and payment routes. It is receive-only from the client's side; inbound frames
are ignored and only used to detect disconnection.
"""

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from source.application_startup.database_connection import open_database_session
from source.modules.employee_management.public_interface import (
    retrieve_employee_for_user_account,
)
from source.modules.realtime_events.employee_event_connection_manager import (
    employee_event_connection_manager,
)
from source.shared_infrastructure.current_authenticated_user_dependency import (
    decode_access_token_or_none,
)

_WEBSOCKET_CLOSE_UNAUTHENTICATED = 4401
_WEBSOCKET_CLOSE_FORBIDDEN = 4403

realtime_events_router = APIRouter(tags=["Realtime Events"])


@realtime_events_router.websocket("/api/v1/ws/employee/events")
async def employee_events_websocket(
    websocket: WebSocket,
    token: str = Query(default=""),
):
    """Personal event stream for a signed-in employee (driver or passenger)."""
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
    if employee is None:
        await websocket.close(code=_WEBSOCKET_CLOSE_FORBIDDEN)
        return

    employee_id = employee.id
    await employee_event_connection_manager.connect(employee_id, websocket)
    try:
        while True:
            # The client never sends meaningful frames; this await simply keeps
            # the socket open and surfaces disconnection.
            await websocket.receive_text()
    except WebSocketDisconnect:
        employee_event_connection_manager.disconnect(employee_id, websocket)
