"""Safe audit logging for chatbot security-relevant events."""

from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.engine import Engine

from app.security import ChatbotUserSecurityContext, create_safe_identifier


class ChatbotAuditLogger:
    """Writes safe audit records without secrets or full tool traces."""

    def __init__(self, chatbot_database_engine: Engine):
        self.chatbot_database_engine = chatbot_database_engine

    def record_event(
        self,
        user_context: ChatbotUserSecurityContext,
        action: str,
        status: str,
        error_code: str | None = None,
        record_count: int | None = None,
    ) -> None:
        """Persist one safe audit event."""
        with self.chatbot_database_engine.begin() as connection:
            connection.execute(
                text("""
                    INSERT INTO chatbot_audit_events
                    (safe_whatsapp_identifier, user_account_id, organization_id, role, action, status, error_code, record_count, created_at)
                    VALUES (:safe_whatsapp_identifier, :user_account_id, :organization_id, :role, :action, :status, :error_code, :record_count, :created_at)
                """),
                {
                    "safe_whatsapp_identifier": create_safe_identifier(user_context.whatsapp_id),
                    "user_account_id": user_context.user_account_id,
                    "organization_id": user_context.organization_id,
                    "role": user_context.role,
                    "action": action,
                    "status": status,
                    "error_code": error_code,
                    "record_count": record_count,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                },
            )
