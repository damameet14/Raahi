"""Booking creation with atomic double-booking protection.

A request is fulfilled by exactly one booking. Two paths lead here — a
passenger booking an offer, or a driver accepting requests — and both must
never fulfill the same request twice or oversell an offer's seats. Each
booking attempt runs inside a SAVEPOINT: it reserves a seat and claims the
request atomically, and rolls back cleanly if either guard fails.
"""

import secrets

from sqlalchemy.orm import Session

from source.modules.ride_coordination.ride_request_record_model import (
    RideRequestRecord,
)
from source.modules.ride_coordination.ride_offer_record_model import RideOfferRecord
from source.modules.ride_coordination.ride_booking_record_model import (
    RideBookingRecord,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideRequestStatus,
    RideOfferJourneyStatus,
)
from source.modules.ride_coordination.ride_coordination_repository import (
    claim_pending_ride_request,
    reserve_offer_seats,
    insert_ride_booking,
)


class RideRequestNoLongerAvailableError(Exception):
    """Raised when a request was already matched by another booking."""


class RideOfferSeatsUnavailableError(Exception):
    """Raised when an offer no longer has enough seats for the request."""


class _BookingAttemptFailed(Exception):
    """Internal signal to roll back a single savepoint-scoped attempt."""


def _generate_otp_code() -> str:
    """Return a random 4-digit OTP as a zero-padded string."""
    return f"{secrets.randbelow(10000):04d}"


def _build_booking_record(
    *, ride_request: RideRequestRecord, ride_offer: RideOfferRecord
) -> RideBookingRecord:
    """Construct a booking record linking a request to an offer."""
    return RideBookingRecord(
        organization_id=ride_offer.organization_id,
        ride_request_id=ride_request.id,
        ride_offer_id=ride_offer.id,
        passenger_employee_id=ride_request.passenger_employee_id,
        driver_employee_id=ride_offer.driver_employee_id,
        seats_booked=ride_request.seats_requested,
        fare_amount=ride_request.estimated_fare_amount or 0.0,
        pickup_latitude=ride_request.source_latitude,
        pickup_longitude=ride_request.source_longitude,
        drop_latitude=ride_request.destination_latitude,
        drop_longitude=ride_request.destination_longitude,
        otp_code=_generate_otp_code(),
        # trip_status is intentionally omitted so the model default (BOOKED)
        # applies; passing None would insert a NULL and violate NOT NULL.
    )


def _attempt_booking_within_savepoint(
    *,
    database_session: Session,
    ride_request: RideRequestRecord,
    ride_offer: RideOfferRecord,
) -> RideBookingRecord:
    """Reserve a seat and claim the request atomically inside a SAVEPOINT.

    Raises _BookingAttemptFailed (rolling the savepoint back) if either the
    seat reservation or the request claim loses the race.
    """
    savepoint = database_session.begin_nested()
    try:
        seats_reserved = reserve_offer_seats(
            database_session=database_session,
            ride_offer_id=ride_offer.id,
            seats_to_reserve=ride_request.seats_requested,
        )
        if not seats_reserved:
            raise _BookingAttemptFailed()

        request_claimed = claim_pending_ride_request(
            database_session=database_session,
            ride_request_id=ride_request.id,
        )
        if not request_claimed:
            raise _BookingAttemptFailed()

        booking = _build_booking_record(
            ride_request=ride_request, ride_offer=ride_offer
        )
        insert_ride_booking(database_session, booking)
        database_session.flush()
    except _BookingAttemptFailed:
        savepoint.rollback()
        raise
    savepoint.commit()
    return booking


def _mark_offer_full_if_exhausted(
    *, database_session: Session, ride_offer: RideOfferRecord
) -> None:
    """Flip an OPEN offer to FULL once its seats reach zero."""
    database_session.refresh(ride_offer)
    if (
        ride_offer.seats_available <= 0
        and ride_offer.journey_status == RideOfferJourneyStatus.OPEN.value
    ):
        ride_offer.journey_status = RideOfferJourneyStatus.FULL.value


def book_offer_for_request(
    *,
    database_session: Session,
    ride_request: RideRequestRecord,
    ride_offer: RideOfferRecord,
) -> RideBookingRecord:
    """Book a single passenger request onto an offer (Select Ride, 1C).

    Raises RideOfferSeatsUnavailableError or RideRequestNoLongerAvailableError
    if the offer or request was taken concurrently.
    """
    try:
        booking = _attempt_booking_within_savepoint(
            database_session=database_session,
            ride_request=ride_request,
            ride_offer=ride_offer,
        )
    except _BookingAttemptFailed:
        # Distinguish the two failure causes for a precise API error.
        database_session.refresh(ride_request)
        if ride_request.status != RideRequestStatus.PENDING.value:
            raise RideRequestNoLongerAvailableError(ride_request.id)
        raise RideOfferSeatsUnavailableError(ride_offer.id)

    _mark_offer_full_if_exhausted(
        database_session=database_session, ride_offer=ride_offer
    )
    database_session.commit()
    database_session.refresh(booking)
    return booking


def accept_requests_onto_offer(
    *,
    database_session: Session,
    ride_offer: RideOfferRecord,
    ride_requests: list[RideRequestRecord],
) -> list[RideBookingRecord]:
    """Driver accepts multiple matching requests onto their offer (2C).

    Requests taken concurrently or exceeding remaining seats are skipped;
    the successfully created bookings are returned. Total accepted seats can
    never exceed the offer's capacity because each attempt reserves seats
    atomically.
    """
    created_bookings: list[RideBookingRecord] = []
    for ride_request in ride_requests:
        try:
            booking = _attempt_booking_within_savepoint(
                database_session=database_session,
                ride_request=ride_request,
                ride_offer=ride_offer,
            )
        except _BookingAttemptFailed:
            continue
        created_bookings.append(booking)

    _mark_offer_full_if_exhausted(
        database_session=database_session, ride_offer=ride_offer
    )
    database_session.commit()
    for booking in created_bookings:
        database_session.refresh(booking)
    return created_bookings
