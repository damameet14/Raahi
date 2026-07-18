"""High-level notification events, fanned out across delivery channels.

Callers invoke one business-event function (e.g. an employee was provisioned)
and this service decides which channels to use and renders the content. Each
send is independently best-effort; one channel failing never blocks another
or the caller.
"""

import logging

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)
from source.modules.notifications.email_delivery_service import send_email
from source.modules.notifications.notification_templates import (
    build_temporary_password_email,
)

logger = logging.getLogger(__name__)


def send_employee_temporary_password_notification(
    *,
    configuration: ApplicationConfiguration,
    full_name: str,
    login_email: str,
    temporary_password: str,
) -> None:
    """Notify a newly provisioned (or password-reset) employee by email."""
    email = build_temporary_password_email(
        full_name=full_name,
        login_email=login_email,
        temporary_password=temporary_password,
        login_url=configuration.frontend_url,
        platform_name=configuration.razorpay_company_name,
    )
    send_email(configuration=configuration, email=email)
