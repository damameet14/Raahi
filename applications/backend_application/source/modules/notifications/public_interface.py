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
from source.modules.notifications.notification_contracts import (
    PaymentNotificationDetails,
    RideNotificationDetails,
)
from source.modules.notifications.notification_dispatch_service import (
    notify_booking_cancelled,
    notify_journey_cancelled_to_passenger,
    notify_journey_started_to_passenger,
    notify_organization_approved,
    notify_organization_registration_received,
    notify_organization_rejected,
    notify_payment_failed,
    notify_payment_succeeded,
    notify_pickup_verified_to_passenger,
    notify_ride_booking_confirmed,
    notify_ride_reminder_to_driver,
    notify_ride_reminder_to_passenger,
    notify_trip_completed_to_passenger,
    send_employee_temporary_password_notification,
)

__all__ = [
    "OutboundEmail",
    "send_email",
    "send_whatsapp_message",
    "PaymentNotificationDetails",
    "RideNotificationDetails",
    "send_employee_temporary_password_notification",
    "notify_organization_registration_received",
    "notify_organization_approved",
    "notify_organization_rejected",
    "notify_ride_booking_confirmed",
    "notify_journey_started_to_passenger",
    "notify_pickup_verified_to_passenger",
    "notify_trip_completed_to_passenger",
    "notify_booking_cancelled",
    "notify_journey_cancelled_to_passenger",
    "notify_ride_reminder_to_passenger",
    "notify_ride_reminder_to_driver",
    "notify_payment_succeeded",
    "notify_payment_failed",
]
