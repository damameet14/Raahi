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
    payment_page_url: str = Field(
        default="http://localhost:5173/payments", alias="PAYMENT_PAGE_URL"
    )

    # ── External Services ────────────────────────────────────
    google_maps_api_key: str = Field(default="", alias="GOOGLE_MAPS_API_KEY")

    # Razorpay test-mode payment processing
    razorpay_key_id: str = Field(default="", alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str = Field(default="", alias="RAZORPAY_KEY_SECRET")
    razorpay_webhook_secret: str = Field(default="", alias="RAZORPAY_WEBHOOK_SECRET")
    razorpay_currency: str = Field(default="INR", alias="RAZORPAY_CURRENCY")
    razorpay_company_name: str = Field(
        default="Carpooling Platform", alias="RAZORPAY_COMPANY_NAME"
    )
    razorpay_company_description: str = Field(
        default="Employee completed ride payment",
        alias="RAZORPAY_COMPANY_DESCRIPTION",
    )
    razorpay_theme_color: str = Field(default="#2fb86f", alias="RAZORPAY_THEME_COLOR")

    # Internal Nodemailer bridge service
    email_enabled: bool = Field(default=False, alias="EMAIL_ENABLED")
    email_notification_service_url: str = Field(
        default="http://localhost:8010", alias="EMAIL_NOTIFICATION_SERVICE_URL"
    )
    internal_email_service_token: str = Field(
        default="change-this-in-real-env", alias="INTERNAL_EMAIL_SERVICE_TOKEN"
    )
    email_payment_pending_enabled: bool = Field(
        default=True, alias="EMAIL_PAYMENT_PENDING_ENABLED"
    )
    email_payment_success_enabled: bool = Field(
        default=True, alias="EMAIL_PAYMENT_SUCCESS_ENABLED"
    )
    email_payment_failed_enabled: bool = Field(
        default=True, alias="EMAIL_PAYMENT_FAILED_ENABLED"
    )
    email_send_timeout_ms: int = Field(default=10000, alias="EMAIL_SEND_TIMEOUT_MS")

    model_config = {"env_file": [".env", "../../.env"], "extra": "ignore"}


def create_application_configuration() -> ApplicationConfiguration:
    """Create and return the application configuration singleton."""
    return ApplicationConfiguration()
