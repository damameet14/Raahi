"""Public interface for the real-time events module.

Other modules push ride-lifecycle events to specific employees through
``publish_employee_event``; the application startup binds the event loop so
synchronous HTTP handlers can publish across threads.
"""

from typing import Iterable

from source.modules.realtime_events.employee_event_connection_manager import (
    employee_event_connection_manager,
)

__all__ = [
    "publish_employee_event",
    "bind_realtime_event_loop",
]


def publish_employee_event(employee_ids: Iterable[str], event: dict) -> None:
    """Best-effort push of a JSON event to the given employees' live sockets."""
    employee_event_connection_manager.publish_threadsafe(employee_ids, event)


def bind_realtime_event_loop(event_loop) -> None:
    """Record the running asyncio loop for cross-thread event publishing."""
    employee_event_connection_manager.bind_event_loop(event_loop)
