"""Pre-ride reminder sweep: notify participants ~15 minutes before departure.

Run periodically by the scheduler. Each offer is reminded at most once, guarded
by its ``reminder_sent`` flag, so re-running the sweep never double-sends.
"""

import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)
from source.modules.notifications.public_interface import (
    notify_ride_reminder_to_driver,
    notify_ride_reminder_to_passenger,
)
from source.modules.ride_coordination.ride_offer_record_model import (
    RideOfferRecord,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideBookingTripStatus,
    RideOfferJourneyStatus,
)
from source.modules.ride_coordination.ride_coordination_repository import (
    list_bookings_for_offer,
)
from source.modules.ride_coordination.ride_notification_dispatch import (
    build_ride_notification_details,
)
from source.modules.ride_coordination.trip_lifecycle_service import (
    _offer_departure_datetime,
)

logger = logging.getLogger(__name__)

_REMINDER_LEAD_MINUTES = 15


def send_due_ride_reminders(
    *,
    database_session: Session,
    configuration: ApplicationConfiguration,
    current_time: datetime | None = None,
) -> int:
    """Send reminders for offers departing within the next 15 minutes.

    Returns how many offers were reminded. Only OPEN/FULL offers that have not
    yet been reminded and whose departure falls in ``(now, now + 15min]`` are
    considered; each is flagged so it is reminded exactly once.
    """
    now = current_time if current_time is not None else datetime.now()
    reminder_window_end = now + timedelta(minutes=_REMINDER_LEAD_MINUTES)

    due_offers = (
        database_session.query(RideOfferRecord)
        .filter(
            RideOfferRecord.reminder_sent.is_(False),
            RideOfferRecord.journey_status.in_(
                (
                    RideOfferJourneyStatus.OPEN.value,
                    RideOfferJourneyStatus.FULL.value,
                )
            ),
            RideOfferRecord.travel_date == now.date(),
        )
        .all()
    )

    reminded_offer_count = 0
    for ride_offer in due_offers:
        departure_time = _offer_departure_datetime(ride_offer)
        if not (now < departure_time <= reminder_window_end):
            continue
        try:
            _remind_offer_participants(
                database_session=database_session,
                configuration=configuration,
                ride_offer=ride_offer,
            )
        except Exception as reminder_error:  # noqa: BLE001 - one bad offer
            logger.warning(
                "Ride reminder for offer %s failed safely: %s",
                ride_offer.id,
                reminder_error,
            )
            continue
        ride_offer.reminder_sent = True
        reminded_offer_count += 1

    if reminded_offer_count:
        database_session.commit()
    return reminded_offer_count


def _remind_offer_participants(
    *,
    database_session: Session,
    configuration: ApplicationConfiguration,
    ride_offer: RideOfferRecord,
) -> None:
    """Remind every awaiting passenger and the driver for one offer."""
    active_bookings = [
        booking
        for booking in list_bookings_for_offer(
            database_session=database_session, ride_offer_id=ride_offer.id
        )
        if booking.trip_status == RideBookingTripStatus.BOOKED.value
    ]
    if not active_bookings:
        return

    driver_full_name = ""
    driver_phone = None
    for booking in active_bookings:
        details = build_ride_notification_details(database_session, booking)
        driver_full_name = details.driver_full_name
        driver_phone = details.driver_phone
        notify_ride_reminder_to_passenger(
            configuration=configuration, details=details
        )

    notify_ride_reminder_to_driver(
        configuration=configuration,
        driver_phone=driver_phone,
        driver_full_name=driver_full_name,
        passenger_count=len(active_bookings),
        travel_time=ride_offer.departure_window_start_time,
    )
