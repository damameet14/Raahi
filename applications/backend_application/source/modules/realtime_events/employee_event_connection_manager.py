"""In-process registry of live per-employee event sockets.

Holds the open WebSocket connections for each employee so ride-lifecycle events
(booking confirmed, trip started/completed, cancellations, payments) can be
pushed to the specific driver and passengers they concern, regardless of which
screen they are viewing.

State lives in this single process. The HTTP routes that trigger events run in
a threadpool (they are synchronous ``def`` handlers), while the WebSockets live
on the asyncio event loop, so publishing crosses threads: the loop is captured
at startup and coroutines are scheduled onto it with
``run_coroutine_threadsafe``. Running multiple worker processes would need a
shared broker instead, which is out of scope.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Iterable

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class EmployeeEventConnectionManager:
    """Tracks connected sockets by employee id and pushes JSON events."""

    def __init__(self) -> None:
        self._connections_by_employee: dict[str, set[WebSocket]] = {}
        self._event_loop: asyncio.AbstractEventLoop | None = None

    def bind_event_loop(self, event_loop: asyncio.AbstractEventLoop) -> None:
        """Record the running loop so sync callers can publish onto it."""
        self._event_loop = event_loop

    async def connect(self, employee_id: str, websocket: WebSocket) -> None:
        """Accept a socket and add it to its employee's room."""
        await websocket.accept()
        self._connections_by_employee.setdefault(employee_id, set()).add(websocket)

    def disconnect(self, employee_id: str, websocket: WebSocket) -> None:
        """Remove a socket from its employee's room."""
        room = self._connections_by_employee.get(employee_id)
        if room is None:
            return
        room.discard(websocket)
        if not room:
            self._connections_by_employee.pop(employee_id, None)

    async def broadcast(self, employee_ids: Iterable[str], event: dict) -> None:
        """Send a JSON event to every open socket of the given employees."""
        for employee_id in set(employee_ids):
            room = self._connections_by_employee.get(employee_id)
            if not room:
                continue
            dead_connections: list[WebSocket] = []
            for websocket in set(room):
                try:
                    await websocket.send_json(event)
                except Exception:  # noqa: BLE001 - drop broken sockets
                    dead_connections.append(websocket)
            for websocket in dead_connections:
                self.disconnect(employee_id, websocket)

    def publish_threadsafe(self, employee_ids: Iterable[str], event: dict) -> None:
        """Schedule a broadcast from a synchronous (threadpool) caller.

        Never raises: a failed real-time push must not break the HTTP request
        that already committed the underlying ride/payment transition.
        """
        recipient_ids = [identifier for identifier in set(employee_ids) if identifier]
        if not recipient_ids or self._event_loop is None:
            return
        try:
            asyncio.run_coroutine_threadsafe(
                self.broadcast(recipient_ids, event), self._event_loop
            )
        except Exception as publish_error:  # noqa: BLE001 - best-effort
            logger.warning("Real-time event publish failed safely: %s", publish_error)


employee_event_connection_manager = EmployeeEventConnectionManager()
