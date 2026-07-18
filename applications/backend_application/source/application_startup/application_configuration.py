"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from pydantic import AliasChoices, Field


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

    # ── Razorpay Payments ────────────────────────────────────
    razorpay_key_id: str = Field(default="", alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str = Field(default="", alias="RAZORPAY_KEY_SECRET")
    razorpay_webhook_secret: str = Field(
        default="", alias="RAZORPAY_WEBHOOK_SECRET"
    )
    razorpay_currency: str = Field(default="INR", alias="RAZORPAY_CURRENCY")
    razorpay_company_name: str = Field(
        default="Raahi", alias="RAZORPAY_COMPANY_NAME"
    )
    razorpay_company_description: str = Field(
        default="Enterprise carpooling payment",
        alias="RAZORPAY_COMPANY_DESCRIPTION",
    )
    razorpay_theme_color: str = Field(
        default="#249448", alias="RAZORPAY_THEME_COLOR"
    )

    # ── Email (SMTP) ─────────────────────────────────────────
    # Accept both the Python-style names and the Node bridge names
    # (SMTP_USER / SMTP_SECURE) so an existing .env works unchanged.
    email_enabled: bool = Field(default=False, alias="EMAIL_ENABLED")
    smtp_host: str = Field(default="", alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    # STARTTLS on a plaintext port (typically 587).
    smtp_use_tls: bool = Field(default=True, alias="SMTP_USE_TLS")
    # Implicit TLS / SMTPS (typically 465). Also inferred when port == 465.
    smtp_use_ssl: bool = Field(
        default=False,
        validation_alias=AliasChoices("SMTP_USE_SSL", "SMTP_SECURE"),
    )
    smtp_username: str = Field(
        default="",
        validation_alias=AliasChoices("SMTP_USERNAME", "SMTP_USER"),
    )
    smtp_password: str = Field(default="", alias="SMTP_PASSWORD")
    email_from_name: str = Field(default="Raahi", alias="EMAIL_FROM_NAME")
    email_from_address: str = Field(
        default="no-reply@raahi.local", alias="EMAIL_FROM_ADDRESS"
    )

    # ── WhatsApp outbound bridge (Node whatsapp-web.js sidecar) ──
    whatsapp_enabled: bool = Field(default=False, alias="WHATSAPP_ENABLED")
    whatsapp_service_url: str = Field(
        default="http://localhost:8090", alias="WHATSAPP_SERVICE_URL"
    )
    whatsapp_notification_api_key: str = Field(
        default="", alias="WHATSAPP_NOTIFICATION_API_KEY"
    )

    model_config = {"env_file": [".env", "../../.env"], "extra": "ignore"}


def create_application_configuration() -> ApplicationConfiguration:
    """Create and return the application configuration singleton."""
    return ApplicationConfiguration()
