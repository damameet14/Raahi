"""HTTP contracts shared by the WhatsApp bridge and agent server."""

from datetime import datetime
from pydantic import BaseModel, Field


class WhatsAppChatRequest(BaseModel):
    """Inbound chat request from the WhatsApp server."""

    whatsapp_id: str
    phone_number: str
    message_id: str
    message: str = Field(min_length=1)
    timestamp: datetime


class WhatsAppChatResponse(BaseModel):
    """Safe response returned to WhatsApp without internal traces."""

    success: bool
    reply: str
    classification: str
    authenticated: bool
    error_code: str | None = None


class ReadinessResponse(BaseModel):
    """Readiness status for important agent dependencies."""

    status: str
    chatbot_database: bool
    erp_database: bool
    llm_provider_configured: bool
    rag_index_available: bool
