"""WhatsApp outbound delivery via the whatsapp-web.js sidecar.

Sending is gated by ``WHATSAPP_ENABLED``. When disabled or unreachable the
message is logged instead of sent. The sidecar is a separate Node service
(``applications/whatsapp_server``) that owns the actual WhatsApp session.
"""

import logging

import httpx

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)

logger = logging.getLogger(__name__)

_SEND_MESSAGE_PATH = "/internal/send-message"
_REQUEST_TIMEOUT_SECONDS = 10.0


def send_whatsapp_message(
    *,
    configuration: ApplicationConfiguration,
    phone_number: str | None,
    message: str,
) -> bool:
    """Send one WhatsApp message; log and return False on any failure.

    ``phone_number`` may include spaces, dashes, or a leading ``+`` — the
    sidecar normalizes it. Returns True only when the sidecar accepted it.
    """
    if not phone_number:
        logger.info("No phone number on record; skipping WhatsApp message")
        return False
    if not configuration.whatsapp_enabled or not configuration.whatsapp_service_url:
        logger.info(
            "WhatsApp disabled or unconfigured; would send to %s: %s",
            phone_number,
            message,
        )
        return False

    try:
        response = httpx.post(
            f"{configuration.whatsapp_service_url.rstrip('/')}{_SEND_MESSAGE_PATH}",
            json={"phoneNumber": phone_number, "message": message},
            headers={
                "X-WhatsApp-Notification-Key": (
                    configuration.whatsapp_notification_api_key
                )
            },
            timeout=_REQUEST_TIMEOUT_SECONDS,
        )
        if response.status_code >= 400:
            logger.warning(
                "WhatsApp sidecar rejected message to %s (%s): %s",
                phone_number,
                response.status_code,
                response.text[:200],
            )
            return False
        return True
    except Exception as delivery_error:  # noqa: BLE001 - best-effort channel
        logger.warning(
            "WhatsApp delivery to %s failed safely: %s",
            phone_number,
            delivery_error,
        )
        return False
