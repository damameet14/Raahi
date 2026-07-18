"""FastAPI entry point for the Raahi WhatsApp AI agent service."""

from pathlib import Path

from fastapi import Depends, FastAPI
from sqlalchemy import text

from app.api_contracts import ReadinessResponse, WhatsAppChatRequest, WhatsAppChatResponse
from app.audit import ChatbotAuditLogger
from app.authentication_service import WhatsAppAuthenticationService
from app.chat_service import RaahiWhatsAppAgentService
from app.config import create_agent_server_configuration
from app.database import (
    create_chatbot_database_engine,
    create_erp_database_engine,
    initialize_chatbot_database,
)
from app.database_tools import ReadOnlyERPDatabaseTools
from app.llm_factory import create_chat_model
from app.memory import ChatbotMemoryStore
from app.rag_service import RoleAwareRAGService
from app.security import require_internal_api_key

configuration = create_agent_server_configuration()
chatbot_database_engine = create_chatbot_database_engine(configuration)
erp_database_engine = create_erp_database_engine(configuration)
initialize_chatbot_database(chatbot_database_engine)

app = FastAPI(title="Raahi WhatsApp AI Agent", version="1.0.0")


def create_chat_service() -> RaahiWhatsAppAgentService:
    """Construct the chat service and its side-effect boundaries."""
    return RaahiWhatsAppAgentService(
        authentication_service=WhatsAppAuthenticationService(
            chatbot_database_engine, erp_database_engine
        ),
        database_tools=ReadOnlyERPDatabaseTools(erp_database_engine),
        rag_service=RoleAwareRAGService(configuration.rag_source_directory),
        memory_store=ChatbotMemoryStore(
            chatbot_database_engine, configuration.max_history_messages
        ),
        audit_logger=ChatbotAuditLogger(chatbot_database_engine),
    )


@app.get("/health")
def health_check() -> dict:
    """Return basic process health."""
    return {"status": "healthy", "application": "raahi-whatsapp-agent"}


@app.get("/ready", response_model=ReadinessResponse)
def readiness_check() -> ReadinessResponse:
    """Check dependencies without expensive LLM generation."""
    chatbot_database_ready = False
    erp_database_ready = False
    try:
        with chatbot_database_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        chatbot_database_ready = True
    except Exception:
        chatbot_database_ready = False
    try:
        with erp_database_engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        erp_database_ready = True
    except Exception:
        erp_database_ready = False
    chat_model = create_chat_model(configuration)
    rag_index_available = Path(configuration.faiss_index_path).exists()
    return ReadinessResponse(
        status="ready" if chatbot_database_ready and erp_database_ready else "degraded",
        chatbot_database=chatbot_database_ready,
        erp_database=erp_database_ready,
        llm_provider_configured=bool(chat_model.provider and chat_model.model_name),
        rag_index_available=rag_index_available,
    )


@app.post(
    "/api/v1/chat",
    response_model=WhatsAppChatResponse,
    dependencies=[Depends(require_internal_api_key)],
)
def process_chat_message(request: WhatsAppChatRequest) -> WhatsAppChatResponse:
    """Process a WhatsApp message through the agent workflow."""
    try:
        return create_chat_service().answer_chat_request(request)
    except Exception:
        return WhatsAppChatResponse(
            success=False,
            reply="I understood your request, but I could not safely retrieve that information.",
            classification="UNKNOWN",
            authenticated=False,
            error_code="TOOL_FAILURE",
        )
