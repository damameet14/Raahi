"""Database connections for read-only ERP access and chatbot memory/audit storage."""

from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

from app.config import AgentServerConfiguration


def create_erp_database_engine(configuration: AgentServerConfiguration) -> Engine:
    """Create the ERP database engine used only by allow-listed read tools."""
    return create_engine(configuration.erp_database_url, pool_pre_ping=True)


def create_chatbot_database_engine(configuration: AgentServerConfiguration) -> Engine:
    """Create SQLite storage for sessions, memory, and audit events."""
    if configuration.chatbot_database_url.startswith("sqlite:///./"):
        database_path = Path(configuration.chatbot_database_url.replace("sqlite:///./", "./"))
        database_path.parent.mkdir(parents=True, exist_ok=True)
    return create_engine(configuration.chatbot_database_url, connect_args={"check_same_thread": False})


def initialize_chatbot_database(chatbot_database_engine: Engine) -> None:
    """Create chatbot-owned tables without touching the ERP schema."""
    with chatbot_database_engine.begin() as connection:
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS chatbot_sessions (
                whatsapp_id TEXT PRIMARY KEY,
                phone_number TEXT NOT NULL,
                user_account_id TEXT,
                employee_id TEXT,
                organization_id TEXT,
                role TEXT NOT NULL DEFAULT 'GUEST',
                display_name TEXT NOT NULL DEFAULT 'Guest',
                authenticated_at TEXT,
                last_seen_at TEXT NOT NULL
            )
        """))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS chatbot_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id TEXT NOT NULL,
                whatsapp_id TEXT NOT NULL,
                direction TEXT NOT NULL,
                message_id TEXT,
                message_text TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS chatbot_long_term_memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                whatsapp_id TEXT NOT NULL,
                organization_id TEXT,
                memory_text TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """))
        connection.execute(text("""
            CREATE TABLE IF NOT EXISTS chatbot_audit_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                safe_whatsapp_identifier TEXT NOT NULL,
                user_account_id TEXT,
                organization_id TEXT,
                role TEXT,
                action TEXT NOT NULL,
                status TEXT NOT NULL,
                error_code TEXT,
                record_count INTEGER,
                created_at TEXT NOT NULL
            )
        """))
