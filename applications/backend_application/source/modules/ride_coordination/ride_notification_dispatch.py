"""Best-effort ride-lifecycle notifications, fired from the ride routes.

This adapter turns ride records into the neutral ``RideNotificationDetails``
the notifications module expects and calls the right dispatch function. Every
entry point swallows its own errors: a notification must never fail or delay a
ride/trip transition that has already committed.
"""

import logging

from sqlalchemy.orm import Session

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)
from source.modules.employee_management.public_interface import (
    retrieve_employee_by_id_within_organization,
)
from source.modules.notifications.public_interface import (
    RideNotificationDetails,
    notify_booking_cancelled,
    notify_journey_cancelled_to_passenger,
    notify_journey_started_to_passenger,
    notify_pickup_verified_to_passenger,
    notify_ride_booking_confirmed,
    notify_trip_completed_to_passenger,
)
from source.modules.ride_coordination.ride_booking_record_model import (
    RideBookingRecord,
)
from source.modules.ride_coordination.ride_offer_record_model import (
    RideOfferRecord,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideBookingTripStatus,
)
from source.modules.ride_coordination.ride_coordination_repository import (
    list_bookings_for_offer,
)
from source.modules.ride_coordination.ride_view_assembly import (
    build_ride_booking_response,
)
from source.modules.realtime_events.public_interface import publish_employee_event

logger = logging.getLogger(__name__)


def notify_booking_confirmed_safely(
    *,
    database_session: Session,
    configuration: ApplicationConfiguration,
    ride_booking: RideBookingRecord,
) -> None:
    """Notify both parties that a new booking was confirmed."""
    _dispatch_safely(
        lambda details: notify_ride_booking_confirmed(
            configuration=configuration, details=details
        ),
        database_session=database_session,
        ride_booking=ride_booking,
    )
    publish_ride_booking_event_safely(
        database_session=database_session,
        ride_booking=ride_booking,
        kind="booking_confirmed",
    )


def notify_journey_started_safely(
    *,
    database_session: Session,
    configuration: ApplicationConfiguration,
    ride_offer: RideOfferRecord,
) -> None:
    """Notify every awaiting passenger that the journey has started."""
    for booking in _active_bookings(database_session, ride_offer):
        _dispatch_safely(
            lambda details: notify_journey_started_to_passenger(
                configuration=configuration, details=details
            ),
            database_session=database_session,
            ride_booking=booking,
        )
        publish_ride_booking_event_safely(
            database_session=database_session,
            ride_booking=booking,
            kind="trip_started",
        )


def notify_pickup_verified_safely(
    *,
    database_session: Session,
    configuration: ApplicationConfiguration,
    ride_booking: RideBookingRecord,
) -> None:
    """Notify a passenger that their trip has started at pickup."""
    _dispatch_safely(
        lambda details: notify_pickup_verified_to_passenger(
            configuration=configuration, details=details
        ),
        database_session=database_session,
        ride_booking=ride_booking,
    )
    publish_ride_booking_event_safely(
        database_session=database_session,
        ride_booking=ride_booking,
        kind="pickup_verified",
    )


def notify_booking_completed_safely(
    *,
    database_session: Session,
    configuration: ApplicationConfiguration,
    ride_booking: RideBookingRecord,
) -> None:
    """Notify a passenger their trip is complete and the fare is due."""
    _dispatch_safely(
        lambda details: notify_trip_completed_to_passenger(
            configuration=configuration, details=details
        ),
        database_session=database_session,
        ride_booking=ride_booking,
    )
    publish_ride_booking_event_safely(
        database_session=database_session,
        ride_booking=ride_booking,
        kind="trip_completed",
    )


def notify_journey_completed_safely(
    *,
    database_session: Session,
    configuration: ApplicationConfiguration,
    ride_offer: RideOfferRecord,
) -> None:
    """Notify every just-completed passenger that their trip is done."""
    for booking in list_bookings_for_offer(
        database_session=database_session, ride_offer_id=ride_offer.id
    ):
        if booking.trip_status == RideBookingTripStatus.COMPLETED.value:
            _dispatch_safely(
                lambda details: notify_trip_completed_to_passenger(
                    configuration=configuration, details=details
                ),
                database_session=database_session,
                ride_booking=booking,
            )
            publish_ride_booking_event_safely(
                database_session=database_session,
                ride_booking=booking,
                kind="trip_completed",
            )


def notify_booking_cancelled_safely(
    *,
    database_session: Session,
    configuration: ApplicationConfiguration,
    ride_booking: RideBookingRecord,
) -> None:
    """Notify both parties that a single booking was cancelled."""
    _dispatch_safely(
        lambda details: notify_booking_cancelled(
            configuration=configuration, details=details
        ),
        database_session=database_session,
        ride_booking=ride_booking,
    )
    publish_ride_booking_event_safely(
        database_session=database_session,
        ride_booking=ride_booking,
        kind="booking_cancelled",
    )


def notify_journey_cancelled_safely(
    *,
    database_session: Session,
    configuration: ApplicationConfiguration,
    ride_offer: RideOfferRecord,
) -> None:
    """Notify every cancelled passenger that the driver withdrew the journey."""
    for booking in list_bookings_for_offer(
        database_session=database_session, ride_offer_id=ride_offer.id
    ):
        if booking.trip_status == RideBookingTripStatus.CANCELLED.value:
            _dispatch_safely(
                lambda details: notify_journey_cancelled_to_passenger(
                    configuration=configuration, details=details
                ),
                database_session=database_session,
                ride_booking=booking,
            )
            publish_ride_booking_event_safely(
                database_session=database_session,
                ride_booking=booking,
                kind="journey_cancelled",
            )


def build_ride_notification_details(
    database_session: Session, ride_booking: RideBookingRecord
) -> RideNotificationDetails:
    """Assemble the neutral notification details for one booking."""
    booking_view = build_ride_booking_response(
        database_session=database_session,
        organization_id=ride_booking.organization_id,
        ride_booking=ride_booking,
        include_otp_code=False,
    )
    passenger = retrieve_employee_by_id_within_organization(
        database_session=database_session,
        employee_id=ride_booking.passenger_employee_id,
        organization_id=ride_booking.organization_id,
    )
    return RideNotificationDetails(
        driver_full_name=booking_view.driver_full_name,
        driver_phone=booking_view.driver_phone,
        passenger_full_name=booking_view.passenger_full_name,
        passenger_phone=passenger.phone if passenger else None,
        travel_date=str(booking_view.travel_date),
        departure_time=booking_view.departure_time,
        pickup_label=booking_view.pickup_label,
        drop_label=booking_view.drop_label,
        vehicle_description=(
            f"{booking_view.vehicle_make_and_model} "
            f"({booking_view.vehicle_number})"
        ),
        fare_amount=booking_view.fare_amount,
    )


def _active_bookings(
    database_session: Session, ride_offer: RideOfferRecord
) -> list[RideBookingRecord]:
    """Bookings still awaiting pickup on an offer (BOOKED)."""
    return [
        booking
        for booking in list_bookings_for_offer(
            database_session=database_session, ride_offer_id=ride_offer.id
        )
        if booking.trip_status == RideBookingTripStatus.BOOKED.value
    ]


def _dispatch_safely(
    dispatch,
    *,
    database_session: Session,
    ride_booking: RideBookingRecord,
) -> None:
    """Build details and run one dispatch, never raising to the caller."""
    try:
        details = build_ride_notification_details(database_session, ride_booking)
        dispatch(details)
    except Exception as dispatch_error:  # noqa: BLE001 - best-effort
        logger.warning(
            "Ride notification for booking %s failed safely: %s",
            ride_booking.id,
            dispatch_error,
        )


def publish_ride_booking_event_safely(
    *,
    database_session: Session,
    ride_booking: RideBookingRecord,
    kind: str,
) -> None:
    """Push a real-time ride-lifecycle event to the affected employees.

    ``kind`` is one of: booking_confirmed, trip_started, pickup_verified,
    trip_completed, booking_cancelled, journey_cancelled. Best-effort — a
    failed push never breaks the transition that already committed.
    """
    try:
        booking_view = build_ride_booking_response(
            database_session=database_session,
            organization_id=ride_booking.organization_id,
            ride_booking=ride_booking,
            include_otp_code=False,
        )
        driver_id = ride_booking.driver_employee_id
        passenger_id = ride_booking.passenger_employee_id
        base = {
            "ride_offer_id": ride_booking.ride_offer_id,
            "ride_booking_id": ride_booking.id,
        }
        driver_name = booking_view.driver_full_name
        passenger_name = booking_view.passenger_full_name

        if kind == "booking_confirmed":
            publish_employee_event(
                [driver_id],
                {**base, "type": kind, "title": "New booking",
                 "message": f"{passenger_name} booked a seat on your ride."},
            )
            publish_employee_event(
                [passenger_id],
                {**base, "type": kind, "title": "Booking confirmed",
                 "message": f"Your ride with {driver_name} is confirmed."},
            )
        elif kind == "trip_started":
            publish_employee_event(
                [passenger_id],
                {**base, "type": kind, "title": "Trip started",
                 "message": f"{driver_name} has started the journey."},
            )
        elif kind == "pickup_verified":
            publish_employee_event(
                [passenger_id],
                {**base, "type": kind, "title": "Pickup confirmed",
                 "message": "Your trip has started."},
            )
        elif kind == "trip_completed":
            publish_employee_event(
                [passenger_id],
                {**base, "type": kind, "title": "Trip completed",
                 "message": f"Pay ₹{booking_view.fare_amount:.0f} for your "
                            f"ride with {driver_name}.",
                 "action": "pay", "fare_amount": booking_view.fare_amount},
            )
        elif kind == "booking_cancelled":
            publish_employee_event(
                [driver_id],
                {**base, "type": kind, "title": "Booking cancelled",
                 "message": f"{passenger_name} cancelled their booking."},
            )
            publish_employee_event(
                [passenger_id],
                {**base, "type": kind, "title": "Booking cancelled",
                 "message": "Your booking was cancelled."},
            )
        elif kind == "journey_cancelled":
            publish_employee_event(
                [passenger_id],
                {**base, "type": kind, "title": "Ride cancelled",
                 "message": f"{driver_name} withdrew the journey."},
            )
    except Exception as publish_error:  # noqa: BLE001 - best-effort
        logger.warning(
            "Real-time ride event (%s) for booking %s failed safely: %s",
            kind,
            ride_booking.id,
            publish_error,
        )
