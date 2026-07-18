"""In-process registry of live chat sockets, grouped per journey.

Holds the open WebSocket connections for each ride offer so a persisted message
can be fanned out to everyone currently viewing that journey's chat. State lives
in this single process; running multiple worker processes would need a shared
broker instead, which is out of scope.
"""

from fastapi import WebSocket


class JourneyChatConnectionManager:
    """Tracks connected sockets by ride offer and broadcasts to a room."""

    def __init__(self) -> None:
        self._connections_by_ride_offer: dict[str, set[WebSocket]] = {}

    async def connect(self, ride_offer_id: str, websocket: WebSocket) -> None:
        """Accept a socket and add it to its journey's room."""
        await websocket.accept()
        self._connections_by_ride_offer.setdefault(ride_offer_id, set()).add(
            websocket
        )

    def disconnect(self, ride_offer_id: str, websocket: WebSocket) -> None:
        """Remove a socket from its journey's room."""
        room = self._connections_by_ride_offer.get(ride_offer_id)
        if room is None:
            return
        room.discard(websocket)
        if not room:
            self._connections_by_ride_offer.pop(ride_offer_id, None)

    async def broadcast(self, ride_offer_id: str, message: dict) -> None:
        """Send a JSON message to every open socket in a journey's room.

        Sockets that fail mid-send are dropped so one dead client never blocks
        delivery to the rest.
        """
        room = self._connections_by_ride_offer.get(ride_offer_id)
        if not room:
            return
        dead_connections: list[WebSocket] = []
        for websocket in set(room):
            try:
                await websocket.send_json(message)
            except Exception:  # noqa: BLE001 - drop broken sockets
                dead_connections.append(websocket)
        for websocket in dead_connections:
            self.disconnect(ride_offer_id, websocket)


journey_chat_connection_manager = JourneyChatConnectionManager()
