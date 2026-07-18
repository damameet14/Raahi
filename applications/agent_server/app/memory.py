"""Short-term chat history and safe long-term memory for the chatbot."""

from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.engine import Engine

from app.security import ChatbotUserSecurityContext

SENSITIVE_MARKERS = {"password", "otp", "token", "api key", "secret", "razorpay"}


class ChatbotMemoryStore:
    """Stores chatbot-owned messages and safe memories in SQLite."""

    def __init__(self, chatbot_database_engine: Engine, max_history_messages: int):
        self.chatbot_database_engine = chatbot_database_engine
        self.max_history_messages = max_history_messages

    def store_message(self, conversation_id: str, whatsapp_id: str, direction: str, message_id: str | None, message_text: str) -> None:
        """Store a single short-term message."""
        with self.chatbot_database_engine.begin() as connection:
            connection.execute(
                text("""
                    INSERT INTO chatbot_messages
                    (conversation_id, whatsapp_id, direction, message_id, message_text, created_at)
                    VALUES (:conversation_id, :whatsapp_id, :direction, :message_id, :message_text, :created_at)
                """),
                {
                    "conversation_id": conversation_id,
                    "whatsapp_id": whatsapp_id,
                    "direction": direction,
                    "message_id": message_id,
                    "message_text": message_text[:2000],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
            )

    def get_recent_messages(self, whatsapp_id: str) -> list[str]:
        """Return recent message texts for follow-up context."""
        with self.chatbot_database_engine.connect() as connection:
            rows = connection.execute(
                text("""
                    SELECT direction, message_text FROM chatbot_messages
                    WHERE whatsapp_id = :whatsapp_id
                    ORDER BY id DESC
                    LIMIT :limit
                """),
                {"whatsapp_id": whatsapp_id, "limit": self.max_history_messages},
            ).mappings().all()
        return [f"{row['direction']}: {row['message_text']}" for row in reversed(rows)]

    def maybe_store_safe_memory(self, user_context: ChatbotUserSecurityContext, message_text: str) -> bool:
        """Store safe preferences only; never store credentials or secrets."""
        lowered_message = message_text.lower()
        if any(marker in lowered_message for marker in SENSITIVE_MARKERS):
            return False
        if "remember" not in lowered_message and "my office" not in lowered_message and "my home" not in lowered_message:
            return False
        with self.chatbot_database_engine.begin() as connection:
            connection.execute(
                text("""
                    INSERT INTO chatbot_long_term_memories
                    (whatsapp_id, organization_id, memory_text, created_at)
                    VALUES (:whatsapp_id, :organization_id, :memory_text, :created_at)
                """),
                {
                    "whatsapp_id": user_context.whatsapp_id,
                    "organization_id": user_context.organization_id,
                    "memory_text": message_text[:500],
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
            )
        return True
