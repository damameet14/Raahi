"""Lightweight role-aware RAG service with FAISS-compatible storage boundaries."""

from pathlib import Path

from app.security import ChatbotUserSecurityContext


class RoleAwareRAGService:
    """Retrieves authorized knowledge snippets from local documents.

    The service is intentionally file-backed for hackathon reliability; the
    dependency list includes FAISS and LangChain so the storage can be upgraded
    without changing callers.
    """

    def __init__(self, source_directory: str):
        self.source_directory = Path(source_directory)

    def retrieve_authorized_answer(self, user_context: ChatbotUserSecurityContext, question: str) -> str:
        """Return a grounded answer from readable text documents when available."""
        if not self.source_directory.exists():
            return "I could not find reliable information about that in the ERP knowledge base."
        lowered_question_words = {
            word.strip(".,?!") for word in question.lower().split() if len(word) > 3
        }
        best_source: tuple[Path, str] | None = None
        best_score = 0
        for document_path in self.source_directory.glob("*.md"):
            text_content = document_path.read_text(encoding="utf-8", errors="ignore")
            if not self.is_document_allowed(user_context, text_content):
                continue
            score = sum(1 for word in lowered_question_words if word in text_content.lower())
            if score > best_score:
                best_score = score
                best_source = (document_path, text_content)
        if best_source is None or best_score == 0:
            return "I could not find reliable information about that in the ERP knowledge base."
        source_path, text_content = best_source
        first_paragraph = next((part.strip() for part in text_content.split("\n\n") if part.strip()), "")
        return f"{first_paragraph[:700]}\n\nSource: {source_path.name}"

    def is_document_allowed(self, user_context: ChatbotUserSecurityContext, text_content: str) -> bool:
        """Apply simple metadata-based role filtering."""
        lowered_content = text_content.lower()
        if "visibility: public" in lowered_content:
            return True
        if not user_context.is_authenticated:
            return False
        if "roles:" not in lowered_content:
            return True
        return user_context.role.lower() in lowered_content
