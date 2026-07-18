"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from pydantic import Field


class ApplicationConfiguration(BaseSettings):
    """Centralized configuration for the Raahi backend application.

    All values are read from environment variables. Defaults are
    provided for local development; production deployments must
    override secrets via environment or .env file.
    """

    # ── Database ─────────────────────────────────────────────
    database_url: str = Field(
        default="postgresql://raahi_user:raahi_secret@localhost:5432/raahi",
        alias="DATABASE_URL",
    )

    # ── JWT Authentication ───────────────────────────────────
    jwt_secret: str = Field(
        default="change-this-to-a-random-secret-in-production",
        alias="JWT_SECRET",
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expiration_minutes: int = Field(
        default=30, alias="JWT_ACCESS_TOKEN_EXPIRATION_MINUTES"
    )
    jwt_refresh_token_expiration_days: int = Field(
        default=7, alias="JWT_REFRESH_TOKEN_EXPIRATION_DAYS"
    )

    # ── Application URLs ─────────────────────────────────────
    frontend_url: str = Field(
        default="http://localhost:5173", alias="FRONTEND_URL"
    )

    # ── External Services ────────────────────────────────────
    google_maps_api_key: str = Field(default="", alias="GOOGLE_MAPS_API_KEY")

    model_config = {"env_file": ".env", "extra": "ignore"}


def create_application_configuration() -> ApplicationConfiguration:
    """Create and return the application configuration singleton."""
    return ApplicationConfiguration()
