"""Password hashing and verification using bcrypt."""

from passlib.context import CryptContext

_password_hashing_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_plain_text_password(plain_text_password: str) -> str:
    """Hash a plain text password for secure storage."""
    return _password_hashing_context.hash(plain_text_password)


def verify_submitted_password_against_hash(
    submitted_plain_text_password: str,
    stored_password_hash: str,
) -> bool:
    """Verify a submitted password against a stored hash.

    Returns True if the password matches, False otherwise.
    """
    return _password_hashing_context.verify(
        submitted_plain_text_password, stored_password_hash
    )
