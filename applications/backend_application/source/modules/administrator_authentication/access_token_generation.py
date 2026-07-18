"""JWT access token and refresh token generation."""

from datetime import datetime, timedelta, timezone
import jwt


def generate_access_token(
    user_account_id: str,
    email: str,
    role: str,
    organization_id: str,
    jwt_secret: str,
    jwt_algorithm: str,
    expiration_minutes: int,
) -> str:
    """Generate a signed JWT access token for the authenticated user."""
    expiration_datetime = datetime.now(timezone.utc) + timedelta(minutes=expiration_minutes)
    payload = {
        "sub": user_account_id,
        "email": email,
        "role": role,
        "organization_id": organization_id,
        "exp": expiration_datetime,
        "type": "access",
    }
    return jwt.encode(payload, jwt_secret, algorithm=jwt_algorithm)


def generate_refresh_token(
    user_account_id: str,
    jwt_secret: str,
    jwt_algorithm: str,
    expiration_days: int,
) -> str:
    """Generate a signed JWT refresh token for token renewal."""
    expiration_datetime = datetime.now(timezone.utc) + timedelta(days=expiration_days)
    payload = {
        "sub": user_account_id,
        "exp": expiration_datetime,
        "type": "refresh",
    }
    return jwt.encode(payload, jwt_secret, algorithm=jwt_algorithm)


def decode_refresh_token(
    refresh_token: str,
    jwt_secret: str,
    jwt_algorithm: str,
) -> dict:
    """Decode and validate a refresh token. Raises jwt errors on failure."""
    payload = jwt.decode(refresh_token, jwt_secret, algorithms=[jwt_algorithm])
    if payload.get("type") != "refresh":
        raise jwt.InvalidTokenError("Token is not a refresh token")
    return payload
