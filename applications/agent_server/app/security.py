"""Security helpers for internal API access and role-aware user context."""

import hashlib
from dataclasses import dataclass

from fastapi import Header, HTTPException, status

from app.config import create_agent_server_configuration


@dataclass(frozen=True)
class ChatbotUserSecurityContext:
    """Resolved user context used by tools, RAG, and memory."""

    whatsapp_id: str
    phone_number: str
    user_account_id: str | None
    employee_id: str | None
    organization_id: str | None
    role: str
    display_name: str
    is_authenticated: bool


async def require_internal_api_key(x_internal_api_key: str | None = Header(default=None)) -> None:
    """Require the WhatsApp bridge to call with the internal shared secret."""
    configuration = create_agent_server_configuration()
    if not configuration.internal_api_key or x_internal_api_key != configuration.internal_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


def create_safe_identifier(value: str) -> str:
    """Create a safe non-reversible identifier for audit logs."""
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:16]
