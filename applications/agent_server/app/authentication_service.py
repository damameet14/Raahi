"""WhatsApp user resolution and lightweight ERP identity mapping."""

from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.engine import Engine

from app.security import ChatbotUserSecurityContext


class WhatsAppAuthenticationService:
    """Maps WhatsApp senders to existing Raahi users through email or phone."""

    def __init__(self, chatbot_database_engine: Engine, erp_database_engine: Engine):
        self.chatbot_database_engine = chatbot_database_engine
        self.erp_database_engine = erp_database_engine

    def resolve_current_user(self, whatsapp_id: str, phone_number: str) -> ChatbotUserSecurityContext:
        """Return authenticated session if known, otherwise guest context."""
        with self.chatbot_database_engine.connect() as connection:
            session_row = connection.execute(
                text("SELECT * FROM chatbot_sessions WHERE whatsapp_id = :whatsapp_id"),
                {"whatsapp_id": whatsapp_id},
            ).mappings().first()
        if session_row and session_row["user_account_id"]:
            return ChatbotUserSecurityContext(
                whatsapp_id=whatsapp_id,
                phone_number=phone_number,
                user_account_id=session_row["user_account_id"],
                employee_id=session_row["employee_id"],
                organization_id=session_row["organization_id"],
                role=session_row["role"],
                display_name=session_row["display_name"],
                is_authenticated=True,
            )
        return ChatbotUserSecurityContext(
            whatsapp_id=whatsapp_id,
            phone_number=phone_number,
            user_account_id=None,
            employee_id=None,
            organization_id=None,
            role="GUEST",
            display_name="Guest",
            is_authenticated=False,
        )

    def try_authenticate_identifier(self, whatsapp_id: str, phone_number: str, identifier: str) -> ChatbotUserSecurityContext | None:
        """Authenticate by matching existing employee email or phone; no passwords are handled here."""
        normalized_identifier = identifier.strip().lower()
        with self.erp_database_engine.connect() as connection:
            user_row = connection.execute(
                text("""
                    SELECT
                        ua.id AS user_account_id,
                        ua.organization_id AS organization_id,
                        ua.role AS role,
                        ua.full_name AS display_name,
                        er.id AS employee_id,
                        er.phone AS employee_phone,
                        er.email AS employee_email
                    FROM user_account_records ua
                    LEFT JOIN employee_records er ON er.user_account_id = ua.id
                    WHERE lower(ua.email) = :identifier
                       OR lower(er.email) = :identifier
                       OR replace(replace(er.phone, '+', ''), '-', '') = :phone_digits
                    LIMIT 1
                """),
                {
                    "identifier": normalized_identifier,
                    "phone_digits": "".join(character for character in normalized_identifier if character.isdigit()),
                },
            ).mappings().first()
        if user_row is None:
            return None
        user_context = ChatbotUserSecurityContext(
            whatsapp_id=whatsapp_id,
            phone_number=phone_number,
            user_account_id=user_row["user_account_id"],
            employee_id=user_row["employee_id"],
            organization_id=user_row["organization_id"],
            role=user_row["role"],
            display_name=user_row["display_name"],
            is_authenticated=True,
        )
        self.store_authenticated_session(user_context)
        return user_context

    def store_authenticated_session(self, user_context: ChatbotUserSecurityContext) -> None:
        """Persist authenticated WhatsApp mapping in chatbot SQLite."""
        with self.chatbot_database_engine.begin() as connection:
            connection.execute(
                text("""
                    INSERT INTO chatbot_sessions
                    (whatsapp_id, phone_number, user_account_id, employee_id, organization_id, role, display_name, authenticated_at, last_seen_at)
                    VALUES (:whatsapp_id, :phone_number, :user_account_id, :employee_id, :organization_id, :role, :display_name, :authenticated_at, :last_seen_at)
                    ON CONFLICT(whatsapp_id) DO UPDATE SET
                        phone_number = excluded.phone_number,
                        user_account_id = excluded.user_account_id,
                        employee_id = excluded.employee_id,
                        organization_id = excluded.organization_id,
                        role = excluded.role,
                        display_name = excluded.display_name,
                        authenticated_at = excluded.authenticated_at,
                        last_seen_at = excluded.last_seen_at
                """),
                {
                    "whatsapp_id": user_context.whatsapp_id,
                    "phone_number": user_context.phone_number,
                    "user_account_id": user_context.user_account_id,
                    "employee_id": user_context.employee_id,
                    "organization_id": user_context.organization_id,
                    "role": user_context.role,
                    "display_name": user_context.display_name,
                    "authenticated_at": datetime.now(timezone.utc).isoformat(),
                    "last_seen_at": datetime.now(timezone.utc).isoformat(),
                },
            )

    def logout(self, whatsapp_id: str) -> None:
        """Forget authenticated identity for a WhatsApp sender."""
        with self.chatbot_database_engine.begin() as connection:
            connection.execute(
                text("DELETE FROM chatbot_sessions WHERE whatsapp_id = :whatsapp_id"),
                {"whatsapp_id": whatsapp_id},
            )
