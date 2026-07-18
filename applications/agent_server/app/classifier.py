"""Deterministic ERP message classification with LLM-compatible labels."""

from enum import Enum


class MessageClassification(str, Enum):
    """Supported chatbot route labels."""

    INTRODUCTION = "INTRODUCTION"
    AUTHENTICATION = "AUTHENTICATION"
    DATABASE_QUERY = "DATABASE_QUERY"
    RAG_QUERY = "RAG_QUERY"
    COMBINED_QUERY = "COMBINED_QUERY"
    LOGOUT = "LOGOUT"
    UNKNOWN = "UNKNOWN"


def classify_message(message_text: str) -> MessageClassification:
    """Classify a message using safe deterministic rules suitable for tests."""
    lowered_message = message_text.strip().lower()
    message_words = {word.strip(".,?!") for word in lowered_message.split()}
    if lowered_message in {"logout", "log out", "sign out"}:
        return MessageClassification.LOGOUT
    if "@" in lowered_message or any(character.isdigit() for character in lowered_message) and len(lowered_message) >= 8:
        return MessageClassification.AUTHENTICATION
    if "who are you" in lowered_message or message_words.intersection({"hello", "hi", "help"}):
        return MessageClassification.INTRODUCTION
    database_words = {"employee", "vehicle", "trip", "ride", "payment", "wallet", "dashboard", "report", "latest"}
    rag_words = {"policy", "rule", "how", "explain", "support", "cancellation"}
    has_database_intent = any(word in lowered_message for word in database_words)
    has_rag_intent = "what is" in lowered_message or bool(message_words.intersection(rag_words))
    if has_database_intent and has_rag_intent:
        return MessageClassification.COMBINED_QUERY
    if has_database_intent:
        return MessageClassification.DATABASE_QUERY
    if has_rag_intent:
        return MessageClassification.RAG_QUERY
    return MessageClassification.UNKNOWN
