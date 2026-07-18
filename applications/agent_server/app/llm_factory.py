"""LLM and embedding provider factory boundaries."""

from dataclasses import dataclass

from app.config import AgentServerConfiguration


@dataclass(frozen=True)
class ChatModelProviderDescription:
    """Describes the configured chat model without forcing generation during health checks."""

    provider: str
    model_name: str
    base_url: str
    temperature: float


def create_chat_model(configuration: AgentServerConfiguration) -> ChatModelProviderDescription:
    """Create a provider descriptor compatible with API, Ollama, or OpenAI-compatible servers."""
    return ChatModelProviderDescription(
        provider=configuration.llm_provider,
        model_name=configuration.llm_model,
        base_url=configuration.llm_base_url,
        temperature=configuration.llm_temperature,
    )


def create_embedding_model(configuration: AgentServerConfiguration) -> str:
    """Return the configured embedding model name for FAISS index compatibility checks."""
    return configuration.embedding_model
