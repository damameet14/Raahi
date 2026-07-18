"""HTTP client for the internal Nodemailer email notification service."""

import logging

import httpx

from source.application_startup.application_configuration import ApplicationConfiguration

logger = logging.getLogger(__name__)


class PaymentEmailNotificationClient:
    """Sends payment email events to the internal Node/Nodemailer bridge."""

    def __init__(self, configuration: ApplicationConfiguration):
        self.configuration = configuration

    async def send_payment_event(self, event_name: str, payload: dict) -> None:
        """Send one payment event without allowing email failure to break payment."""
        if not self.configuration.email_enabled:
            return

        event_endpoint_by_name = {
            "payment-pending": "/internal/payment-pending",
            "payment-success": "/internal/payment-success",
            "payment-failed": "/internal/payment-failed",
        }
        if event_name not in event_endpoint_by_name:
            logger.warning("Unsupported payment email event requested: %s", event_name)
            return

        timeout_seconds = max(self.configuration.email_send_timeout_ms / 1000, 1)
        try:
            async with httpx.AsyncClient(timeout=timeout_seconds) as http_client:
                await http_client.post(
                    f"{self.configuration.email_notification_service_url}"
                    f"{event_endpoint_by_name[event_name]}",
                    json=payload,
                    headers={
                        "X-Internal-Email-Token": (
                            self.configuration.internal_email_service_token
                        )
                    },
                )
        except Exception as error:  # noqa: BLE001
            logger.warning(
                "Payment email delivery failed safely for event %s: %s",
                event_name,
                error.__class__.__name__,
            )

    async def send_payment_pending_email(self, payload: dict) -> None:
        """NODEMAILER_PAYMENT_EMAIL_INTEGRATION MASTER_AGENT_EMAIL_INTEGRATION_POINT."""
        if self.configuration.email_payment_pending_enabled:
            await self.send_payment_event("payment-pending", payload)

    async def send_payment_success_email(self, payload: dict) -> None:
        """Send the payment success email after verified Razorpay completion."""
        if self.configuration.email_payment_success_enabled:
            await self.send_payment_event("payment-success", payload)

    async def send_payment_failed_email(self, payload: dict) -> None:
        """Send a safe payment failure email for retryable failed attempts."""
        if self.configuration.email_payment_failed_enabled:
            await self.send_payment_event("payment-failed", payload)

