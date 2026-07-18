"""FastAPI dependency for extracting and validating the current authenticated user from JWT."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List

import jwt

from source.application_startup.database_connection import get_database_session
from source.shared_infrastructure.user_account_role import UserAccountRole

security_scheme = HTTPBearer()

# Will be set during app startup from configuration
_jwt_secret: str = ""
_jwt_algorithm: str = "HS256"


def configure_authentication_dependency(secret: str, algorithm: str):
    """Set JWT secret and algorithm. Called once during application startup."""
    global _jwt_secret, _jwt_algorithm
    _jwt_secret = secret
    _jwt_algorithm = algorithm


class AuthenticatedUserContext:
    """Represents the currently authenticated user extracted from a valid JWT.

    This context object is injected into route handlers via FastAPI Depends.
    """

    def __init__(
        self,
        user_account_id: str,
        organization_id: str,
        email: str,
        role: UserAccountRole,
    ):
        self.user_account_id = user_account_id
        self.organization_id = organization_id
        self.email = email
        self.role = role


def decode_access_token_or_none(token: str) -> AuthenticatedUserContext | None:
    """Decode a raw JWT access token, returning None if it is not valid.

    Used where FastAPI's HTTP bearer dependency does not apply — notably
    WebSocket handshakes, which carry the token as a query parameter.
    """
    try:
        payload = jwt.decode(token, _jwt_secret, algorithms=[_jwt_algorithm])
        return AuthenticatedUserContext(
            user_account_id=payload["sub"],
            organization_id=payload["organization_id"],
            email=payload["email"],
            role=UserAccountRole(payload["role"]),
        )
    except (jwt.InvalidTokenError, KeyError, ValueError):
        return None


def extract_authenticated_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> AuthenticatedUserContext:
    """FastAPI dependency that extracts and validates the JWT access token.

    Returns an AuthenticatedUserContext if the token is valid.
    Raises HTTP 401 if the token is missing, expired, or invalid.
    """
    authenticated_user = decode_access_token_or_none(credentials.credentials)
    if authenticated_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
        )
    return authenticated_user


def require_roles(allowed_roles: List[UserAccountRole]):
    """Factory that returns a FastAPI dependency enforcing role-based access.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_roles([UserAccountRole.COMPANY_ADMIN]))])
    """

    def role_checker(
        current_user: AuthenticatedUserContext = Depends(extract_authenticated_user),
    ) -> AuthenticatedUserContext:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this operation",
            )
        return current_user

    return role_checker
