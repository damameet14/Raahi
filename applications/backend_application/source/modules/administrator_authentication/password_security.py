"""Password hashing, verification, and temporary-password generation."""

import secrets
import string

from passlib.context import CryptContext

_password_hashing_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Character set for generated temporary passwords. Excludes visually
# ambiguous characters (O/0, I/l/1) so an admin can read the value aloud
# or copy it without transcription errors.
_TEMPORARY_PASSWORD_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"
_TEMPORARY_PASSWORD_LENGTH = 10


def generate_temporary_password() -> str:
    """Generate a random, human-readable temporary password.

    Used when an administrator provisions a login account for an
    employee. The employee is forced to change it on first login.
    """
    return "".join(
        secrets.choice(_TEMPORARY_PASSWORD_ALPHABET)
        for _ in range(_TEMPORARY_PASSWORD_LENGTH)
    )


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
