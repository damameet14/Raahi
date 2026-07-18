"""SMTP email delivery with a safe log-only fallback.

Sending is gated by ``EMAIL_ENABLED``. When disabled or misconfigured the
rendered email is logged instead of sent, so local development and demos
work without SMTP credentials and production failures never break a request.
"""

import logging
import smtplib
from email.message import EmailMessage as MimeEmailMessage

from pydantic import BaseModel

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)

logger = logging.getLogger(__name__)


class OutboundEmail(BaseModel):
    """A single email to send to one recipient."""

    to_address: str
    to_name: str
    subject: str
    body_text: str


def send_email(
    *, configuration: ApplicationConfiguration, email: OutboundEmail
) -> bool:
    """Send one email over SMTP; log and return False on any failure.

    Returns True only when the message was handed to the SMTP server.
    """
    if not configuration.email_enabled or not configuration.smtp_host:
        logger.info(
            "Email disabled or unconfigured; would send to %s: %s\n%s",
            email.to_address,
            email.subject,
            email.body_text,
        )
        return False

    mime_message = MimeEmailMessage()
    mime_message["From"] = (
        f"{configuration.email_from_name} <{configuration.email_from_address}>"
    )
    mime_message["To"] = f"{email.to_name} <{email.to_address}>"
    mime_message["Subject"] = email.subject
    mime_message.set_content(email.body_text)

    # Port 465 speaks TLS immediately (SMTPS) and must use SMTP_SSL; a plaintext
    # SMTP + STARTTLS handshake on 465 fails with a closed connection. Other
    # ports (typically 587) connect plaintext and upgrade with STARTTLS.
    use_implicit_ssl = (
        configuration.smtp_use_ssl or configuration.smtp_port == 465
    )

    try:
        if use_implicit_ssl:
            smtp_connection = smtplib.SMTP_SSL(
                configuration.smtp_host, configuration.smtp_port, timeout=15
            )
        else:
            smtp_connection = smtplib.SMTP(
                configuration.smtp_host, configuration.smtp_port, timeout=15
            )
        with smtp_connection:
            if not use_implicit_ssl and configuration.smtp_use_tls:
                smtp_connection.starttls()
            if configuration.smtp_username:
                smtp_connection.login(
                    configuration.smtp_username, configuration.smtp_password
                )
            smtp_connection.send_message(mime_message)
        logger.info(
            "Sent email to %s: %s", email.to_address, email.subject
        )
        return True
    except Exception as delivery_error:  # noqa: BLE001 - best-effort channel
        logger.warning(
            "Email delivery to %s failed safely: %s",
            email.to_address,
            delivery_error,
        )
        return False
