"""Trip lifecycle transitions and live location recording.

Drives a journey from OPEN through STARTED to COMPLETED, verifies the
per-booking OTP the driver collects at pickup, and records/reads the
driver's live location while a journey is active.
"""

from datetime import datetime, time, timedelta, timezone

from sqlalchemy.orm import Session

from source.modules.ride_coordination.ride_offer_record_model import RideOfferRecord
from source.modules.ride_coordination.ride_booking_record_model import (
    RideBookingRecord,
)
from source.modules.ride_coordination.live_location_ping_record_model import (
    LiveLocationPingRecord,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideOfferJourneyStatus,
    RideBookingTripStatus,
)
from source.modules.ride_coordination.ride_coordination_repository import (
    list_bookings_for_offer,
    insert_location_ping,
    get_latest_location_ping_for_offer,
)


class JourneyNotStartableError(Exception):
    """Raised when a journey cannot transition into STARTED."""


class JourneyNotActiveError(Exception):
    """Raised when an action requires an in-progress (STARTED) journey."""


class IncorrectBookingOtpError(Exception):
    """Raised when the OTP a driver submits does not match the booking."""


class BookingNotAwaitingPickupError(Exception):
    """Raised when a booking is not in a state that accepts OTP verification."""


class BookingNotCancellableError(Exception):
    """Raised when a booking is not in a state that can be cancelled."""


class JourneyNotCancellableError(Exception):
    """Raised when a journey cannot be withdrawn (already started or settled)."""


class JourneyTooCloseToDepartureError(Exception):
    """Raised when a driver tries to cancel too close to the departure time."""


# A driver may withdraw their offered journey only up to this many hours
# before its scheduled departure; inside this window passengers are already
# relying on the ride, so cancellation is blocked.
_DRIVER_CANCELLATION_CUTOFF_HOURS = 2


def _offer_departure_datetime(ride_offer: RideOfferRecord) -> datetime:
    """Combine an offer's travel date and window start into one timestamp."""
    start_hour, start_minute = (
        int(part) for part in ride_offer.departure_window_start_time.split(":")
    )
    return datetime.combine(
        ride_offer.travel_date, time(hour=start_hour, minute=start_minute)
    )


def _current_timestamp() -> datetime:
    """Return the current timezone-aware timestamp."""
    return datetime.now(timezone.utc)


def start_journey(
    *, database_session: Session, ride_offer: RideOfferRecord
) -> RideOfferRecord:
    """Begin a driver's journey so live tracking and pickups can proceed."""
    if ride_offer.journey_status not in (
        RideOfferJourneyStatus.OPEN.value,
        RideOfferJourneyStatus.FULL.value,
    ):
        raise JourneyNotStartableError(ride_offer.id)
    ride_offer.journey_status = RideOfferJourneyStatus.STARTED.value
    database_session.commit()
    database_session.refresh(ride_offer)
    return ride_offer


def verify_booking_otp_and_start_trip(
    *,
    database_session: Session,
    ride_offer: RideOfferRecord,
    ride_booking: RideBookingRecord,
    submitted_otp_code: str,
) -> RideBookingRecord:
    """Verify a passenger's OTP at pickup and start that passenger's trip.

    Requires the journey to be STARTED. Raises IncorrectBookingOtpError on a
    wrong code and BookingNotAwaitingPickupError if the booking is not BOOKED.
    """
    if ride_offer.journey_status != RideOfferJourneyStatus.STARTED.value:
        raise JourneyNotActiveError(ride_offer.id)
    if ride_booking.trip_status != RideBookingTripStatus.BOOKED.value:
        raise BookingNotAwaitingPickupError(ride_booking.id)
    if submitted_otp_code != ride_booking.otp_code:
        raise IncorrectBookingOtpError(ride_booking.id)

    ride_booking.is_otp_verified = True
    ride_booking.trip_status = RideBookingTripStatus.STARTED.value
    ride_booking.started_at = _current_timestamp()
    database_session.commit()
    database_session.refresh(ride_booking)
    return ride_booking


def complete_booking_trip(
    *, database_session: Session, ride_booking: RideBookingRecord
) -> RideBookingRecord:
    """Mark a single passenger's trip completed on drop-off."""
    ride_booking.trip_status = RideBookingTripStatus.COMPLETED.value
    ride_booking.completed_at = _current_timestamp()
    database_session.commit()
    database_session.refresh(ride_booking)
    return ride_booking


def cancel_booking(
    *,
    database_session: Session,
    ride_offer: RideOfferRecord,
    ride_booking: RideBookingRecord,
) -> RideBookingRecord:
    """Cancel a passenger's booking before the driver starts the journey.

    Allowed while the booking is still BOOKED and the parent offer has not
    yet started (OPEN or FULL) — once the driver starts the journey, no
    passenger on it can cancel anymore, even if their own pickup hasn't
    happened yet. The released seats reopen a FULL offer so other
    passengers can be matched again.
    """
    if ride_booking.trip_status != RideBookingTripStatus.BOOKED.value:
        raise BookingNotCancellableError(ride_booking.id)
    if ride_offer.journey_status not in (
        RideOfferJourneyStatus.OPEN.value,
        RideOfferJourneyStatus.FULL.value,
    ):
        raise BookingNotCancellableError(ride_booking.id)

    ride_booking.trip_status = RideBookingTripStatus.CANCELLED.value
    ride_offer.seats_available += ride_booking.seats_booked
    if ride_offer.journey_status == RideOfferJourneyStatus.FULL.value:
        ride_offer.journey_status = RideOfferJourneyStatus.OPEN.value
    database_session.commit()
    database_session.refresh(ride_booking)
    return ride_booking


def cancel_ride_offer(
    *,
    database_session: Session,
    ride_offer: RideOfferRecord,
    current_time: datetime | None = None,
) -> RideOfferRecord:
    """Driver withdraws their offered journey before it starts.

    Allowed while the offer is OPEN or FULL and the scheduled departure is
    still at least ``_DRIVER_CANCELLATION_CUTOFF_HOURS`` hours away. Cancels
    every booking on it that hasn't already reached a terminal state.

    Raises JourneyNotCancellableError if the journey already started or
    settled, or JourneyTooCloseToDepartureError if it is within the cutoff.
    """
    if ride_offer.journey_status not in (
        RideOfferJourneyStatus.OPEN.value,
        RideOfferJourneyStatus.FULL.value,
    ):
        raise JourneyNotCancellableError(ride_offer.id)

    now = current_time if current_time is not None else datetime.now()
    if _offer_departure_datetime(ride_offer) - now < timedelta(
        hours=_DRIVER_CANCELLATION_CUTOFF_HOURS
    ):
        raise JourneyTooCloseToDepartureError(ride_offer.id)

    for booking in list_bookings_for_offer(
        database_session=database_session, ride_offer_id=ride_offer.id
    ):
        if booking.trip_status == RideBookingTripStatus.BOOKED.value:
            booking.trip_status = RideBookingTripStatus.CANCELLED.value

    ride_offer.journey_status = RideOfferJourneyStatus.CANCELLED.value
    database_session.commit()
    database_session.refresh(ride_offer)
    return ride_offer


def complete_journey(
    *, database_session: Session, ride_offer: RideOfferRecord
) -> RideOfferRecord:
    """Complete a journey and settle all of its started/booked trips."""
    completion_timestamp = _current_timestamp()
    for booking in list_bookings_for_offer(
        database_session=database_session, ride_offer_id=ride_offer.id
    ):
        if booking.trip_status in (
            RideBookingTripStatus.BOOKED.value,
            RideBookingTripStatus.STARTED.value,
        ):
            booking.trip_status = RideBookingTripStatus.COMPLETED.value
            booking.completed_at = completion_timestamp
    ride_offer.journey_status = RideOfferJourneyStatus.COMPLETED.value
    database_session.commit()
    database_session.refresh(ride_offer)
    return ride_offer


def record_driver_location(
    *,
    database_session: Session,
    ride_offer: RideOfferRecord,
    latitude: float,
    longitude: float,
) -> LiveLocationPingRecord:
    """Record the driver's current location for an active journey."""
    if ride_offer.journey_status != RideOfferJourneyStatus.STARTED.value:
        raise JourneyNotActiveError(ride_offer.id)
    location_ping = LiveLocationPingRecord(
        organization_id=ride_offer.organization_id,
        ride_offer_id=ride_offer.id,
        driver_employee_id=ride_offer.driver_employee_id,
        latitude=latitude,
        longitude=longitude,
    )
    return insert_location_ping(database_session, location_ping)


def get_latest_driver_location(
    *, database_session: Session, ride_offer_id: str
) -> LiveLocationPingRecord | None:
    """Return the most recent driver location for a journey, if any."""
    return get_latest_location_ping_for_offer(
        database_session=database_session, ride_offer_id=ride_offer_id
    )
