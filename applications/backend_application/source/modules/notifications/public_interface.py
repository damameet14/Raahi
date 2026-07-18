"""Public interface for the notifications module.

External modules import notification behavior only from here.
"""

from source.modules.notifications.email_delivery_service import (
    OutboundEmail,
    send_email,
)
from source.modules.notifications.whatsapp_delivery_service import (
    send_whatsapp_message,
)
from source.modules.notifications.notification_dispatch_service import (
    send_employee_temporary_password_notification,
)

__all__ = [
    "OutboundEmail",
    "send_email",
    "send_whatsapp_message",
    "send_employee_temporary_password_notification",
]
