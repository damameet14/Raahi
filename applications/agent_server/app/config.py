"""Typed configuration for the Raahi WhatsApp AI agent service."""

from pydantic import Field
from pydantic_settings import BaseSettings


class AgentServerConfiguration(BaseSettings):
    """Environment-backed settings for agent, RAG, memory, and database access."""

    app_env: str = Field(default="development", alias="APP_ENV")
    app_host: str = Field(default="0.0.0.0", alias="APP_HOST")
    app_port: int = Field(default=8001, alias="APP_PORT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    internal_api_key: str = Field(default="replace_with_internal_key", alias="INTERNAL_API_KEY")
    erp_database_url: str = Field(
        default="postgresql+psycopg2://raahi_user:raahi_secret@localhost:5432/raahi",
        alias="ERP_DATABASE_URL",
    )
    erp_database_read_only: bool = Field(default=True, alias="ERP_DATABASE_READ_ONLY")
    chatbot_database_url: str = Field(default="sqlite:///./data/chatbot.sqlite3", alias="CHATBOT_DATABASE_URL")
    llm_provider: str = Field(default="ollama", alias="LLM_PROVIDER")
    llm_model: str = Field(default="qwen2.5:3b", alias="LLM_MODEL")
    llm_base_url: str = Field(default="http://localhost:11434", alias="LLM_BASE_URL")
    llm_api_key: str = Field(default="", alias="LLM_API_KEY")
    llm_temperature: float = Field(default=0.1, alias="LLM_TEMPERATURE")
    llm_timeout_seconds: int = Field(default=60, alias="LLM_TIMEOUT_SECONDS")
    embedding_model: str = Field(default="sentence-transformers/all-MiniLM-L6-v2", alias="EMBEDDING_MODEL")
    faiss_index_path: str = Field(default="./vector_db/faiss", alias="FAISS_INDEX_PATH")
    rag_source_directory: str = Field(default="./documents", alias="RAG_SOURCE_DIRECTORY")
    rag_top_k: int = Field(default=5, alias="RAG_TOP_K")
    rag_score_threshold: float = Field(default=0.45, alias="RAG_SCORE_THRESHOLD")
    authentication_session_expiry_minutes: int = Field(default=480, alias="AUTH_SESSION_EXPIRY_MINUTES")
    max_history_messages: int = Field(default=20, alias="MAX_HISTORY_MESSAGES")

    model_config = {"env_file": ".env", "extra": "ignore"}


def create_agent_server_configuration() -> AgentServerConfiguration:
    """Create an agent server configuration object."""
    return AgentServerConfiguration()
