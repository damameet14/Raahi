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
from source.modules.notifications.notification_contracts import (
    PaymentNotificationDetails,
    RideNotificationDetails,
)
from source.modules.notifications.notification_templates import (
    build_payment_failed_email,
    build_payment_success_email,
    build_payment_success_whatsapp_message,
    build_temporary_password_email,
)
from source.modules.notifications import ride_notification_templates
from source.modules.notifications.whatsapp_delivery_service import (
    send_whatsapp_message,
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


# ── Ride-lifecycle WhatsApp notifications ─────────────────────
def notify_ride_booking_confirmed(
    *, configuration: ApplicationConfiguration, details: RideNotificationDetails
) -> None:
    """Tell the passenger their booking is confirmed and the driver it exists."""
    _send_whatsapp(
        configuration,
        details.passenger_phone,
        ride_notification_templates.build_booking_confirmed_passenger_message(
            details
        ),
    )
    _send_whatsapp(
        configuration,
        details.driver_phone,
        ride_notification_templates.build_booking_confirmed_driver_message(
            details
        ),
    )


def notify_journey_started_to_passenger(
    *, configuration: ApplicationConfiguration, details: RideNotificationDetails
) -> None:
    """Tell one passenger the driver has started the journey."""
    _send_whatsapp(
        configuration,
        details.passenger_phone,
        ride_notification_templates.build_journey_started_passenger_message(
            details
        ),
    )


def notify_pickup_verified_to_passenger(
    *, configuration: ApplicationConfiguration, details: RideNotificationDetails
) -> None:
    """Confirm to the passenger that their trip has started at pickup."""
    _send_whatsapp(
        configuration,
        details.passenger_phone,
        ride_notification_templates.build_pickup_verified_passenger_message(
            details
        ),
    )


def notify_trip_completed_to_passenger(
    *, configuration: ApplicationConfiguration, details: RideNotificationDetails
) -> None:
    """Tell the passenger the trip is done and the fare is due."""
    _send_whatsapp(
        configuration,
        details.passenger_phone,
        ride_notification_templates.build_trip_completed_passenger_message(
            details
        ),
    )


def notify_booking_cancelled(
    *, configuration: ApplicationConfiguration, details: RideNotificationDetails
) -> None:
    """Tell both parties a single passenger's booking was cancelled."""
    _send_whatsapp(
        configuration,
        details.passenger_phone,
        ride_notification_templates.build_booking_cancelled_passenger_message(
            details
        ),
    )
    _send_whatsapp(
        configuration,
        details.driver_phone,
        ride_notification_templates.build_booking_cancelled_driver_message(
            details
        ),
    )


def notify_journey_cancelled_to_passenger(
    *, configuration: ApplicationConfiguration, details: RideNotificationDetails
) -> None:
    """Tell one passenger the driver cancelled the whole journey."""
    _send_whatsapp(
        configuration,
        details.passenger_phone,
        ride_notification_templates.build_journey_cancelled_passenger_message(
            details
        ),
    )


def notify_ride_reminder_to_passenger(
    *, configuration: ApplicationConfiguration, details: RideNotificationDetails
) -> None:
    """Remind one passenger their ride departs in ~15 minutes."""
    _send_whatsapp(
        configuration,
        details.passenger_phone,
        ride_notification_templates.build_ride_reminder_passenger_message(
            details
        ),
    )


def notify_ride_reminder_to_driver(
    *,
    configuration: ApplicationConfiguration,
    driver_phone: str | None,
    driver_full_name: str,
    passenger_count: int,
    travel_time: str,
) -> None:
    """Remind a driver their journey departs in ~15 minutes."""
    _send_whatsapp(
        configuration,
        driver_phone,
        ride_notification_templates.build_ride_reminder_driver_message(
            driver_full_name=driver_full_name,
            passenger_count=passenger_count,
            travel_time=travel_time,
        ),
    )


# ── Payment notifications (email + optional WhatsApp) ─────────
def notify_payment_succeeded(
    *,
    configuration: ApplicationConfiguration,
    details: PaymentNotificationDetails,
) -> None:
    """Email (and WhatsApp) the payer that their fare payment succeeded."""
    send_email(
        configuration=configuration,
        email=build_payment_success_email(
            details=details,
            platform_name=configuration.razorpay_company_name,
        ),
    )
    _send_whatsapp(
        configuration,
        details.payer_phone,
        build_payment_success_whatsapp_message(details),
    )


def notify_payment_failed(
    *,
    configuration: ApplicationConfiguration,
    details: PaymentNotificationDetails,
) -> None:
    """Email the payer that their fare payment could not be completed."""
    send_email(
        configuration=configuration,
        email=build_payment_failed_email(
            details=details,
            platform_name=configuration.razorpay_company_name,
        ),
    )


def _send_whatsapp(
    configuration: ApplicationConfiguration,
    phone_number: str | None,
    message: str,
) -> None:
    """Send one WhatsApp message, swallowing any channel failure."""
    try:
        send_whatsapp_message(
            configuration=configuration,
            phone_number=phone_number,
            message=message,
        )
    except Exception as delivery_error:  # noqa: BLE001 - best-effort channel
        logger.warning("WhatsApp dispatch failed safely: %s", delivery_error)
