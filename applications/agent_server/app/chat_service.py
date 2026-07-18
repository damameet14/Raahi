"""Main LangGraph-compatible chat orchestration service."""

from app.audit import ChatbotAuditLogger
from app.api_contracts import WhatsAppChatRequest, WhatsAppChatResponse
from app.authentication_service import WhatsAppAuthenticationService
from app.classifier import MessageClassification, classify_message
from app.database_tools import ReadOnlyERPDatabaseTools
from app.memory import ChatbotMemoryStore
from app.rag_service import RoleAwareRAGService


class RaahiWhatsAppAgentService:
    """Coordinates classification, authentication, tools, RAG, and memory."""

    def __init__(
        self,
        authentication_service: WhatsAppAuthenticationService,
        database_tools: ReadOnlyERPDatabaseTools,
        rag_service: RoleAwareRAGService,
        memory_store: ChatbotMemoryStore,
        audit_logger: ChatbotAuditLogger,
    ):
        self.authentication_service = authentication_service
        self.database_tools = database_tools
        self.rag_service = rag_service
        self.memory_store = memory_store
        self.audit_logger = audit_logger

    def answer_chat_request(self, request: WhatsAppChatRequest) -> WhatsAppChatResponse:
        """Process one WhatsApp message and return a safe reply."""
        user_context = self.authentication_service.resolve_current_user(
            request.whatsapp_id, request.phone_number
        )
        classification = classify_message(request.message)
        self.memory_store.store_message(
            conversation_id=request.whatsapp_id,
            whatsapp_id=request.whatsapp_id,
            direction="user",
            message_id=request.message_id,
            message_text=request.message,
        )

        if classification == MessageClassification.LOGOUT:
            self.authentication_service.logout(request.whatsapp_id)
            reply = "You are logged out. Send your registered email or phone number when you want to log in again."
        elif classification == MessageClassification.INTRODUCTION:
            reply = (
                "I am the WhatsApp assistant for Raahi Enterprise Carpooling. "
                "I can help authorized users retrieve supported commute information and search company documents. "
                f"You are currently using {'authenticated' if user_context.is_authenticated else 'guest'} access."
            )
        elif classification == MessageClassification.AUTHENTICATION and not user_context.is_authenticated:
            authenticated_context = self.authentication_service.try_authenticate_identifier(
                request.whatsapp_id, request.phone_number, request.message
            )
            if authenticated_context is None:
                reply = "I could not match that email or phone number. Please send your registered Raahi email or phone number."
            else:
                user_context = authenticated_context
                reply = f"You are now logged in as {authenticated_context.display_name} ({authenticated_context.role}). You can ask about ERP information available to your role."
        elif classification == MessageClassification.DATABASE_QUERY:
            if "latest" in request.message.lower() or "trip" in request.message.lower() or "ride" in request.message.lower():
                reply = self.database_tools.get_latest_trip(user_context)
            else:
                reply = self.database_tools.summarize_accessible_records(user_context)
        elif classification == MessageClassification.RAG_QUERY:
            reply = self.rag_service.retrieve_authorized_answer(user_context, request.message)
        elif classification == MessageClassification.COMBINED_QUERY:
            database_reply = self.database_tools.summarize_accessible_records(user_context)
            rag_reply = self.rag_service.retrieve_authorized_answer(user_context, request.message)
            reply = f"{database_reply}\n\nKnowledge base:\n{rag_reply}"
        else:
            reply = "I could not clearly understand that request. Please rephrase it as an ERP-related question."

        self.memory_store.maybe_store_safe_memory(user_context, request.message)
        self.memory_store.store_message(
            conversation_id=request.whatsapp_id,
            whatsapp_id=request.whatsapp_id,
            direction="assistant",
            message_id=None,
            message_text=reply,
        )
        self.audit_logger.record_event(
            user_context=user_context,
            action=f"chat_{classification.value.lower()}",
            status="success",
        )
        return WhatsAppChatResponse(
            success=True,
            reply=reply,
            classification=classification.value,
            authenticated=user_context.is_authenticated,
        )
