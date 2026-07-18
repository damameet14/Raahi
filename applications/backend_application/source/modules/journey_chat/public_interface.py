"""Public interface for the journey chat module.

External code mounts the router; the membership check is exported for reuse.
"""

from source.modules.journey_chat.journey_chat_contracts import (
    ChatMessageResponse,
)
from source.modules.journey_chat.journey_chat_service import (
    is_employee_journey_chat_member,
    resolve_journey_chat_member_ids,
)

__all__ = [
    "ChatMessageResponse",
    "is_employee_journey_chat_member",
    "resolve_journey_chat_member_ids",
]
