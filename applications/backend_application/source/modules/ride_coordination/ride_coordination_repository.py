"""Persistence queries for the ride coordination domain.

Holds all database access for ride requests, offers, bookings, and
location pings, including the atomic guards that prevent a request from
being matched twice or an offer from being oversold.
"""

from datetime import date

from sqlalchemy.orm import Session

from source.modules.ride_coordination.ride_request_record_model import (
    RideRequestRecord,
)
from source.modules.ride_coordination.ride_offer_record_model import RideOfferRecord
from source.modules.ride_coordination.ride_booking_record_model import (
    RideBookingRecord,
)
from source.modules.ride_coordination.live_location_ping_record_model import (
    LiveLocationPingRecord,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideRequestStatus,
    RideOfferJourneyStatus,
)


# ── Ride requests ─────────────────────────────────────────────────────

def insert_ride_request(
    database_session: Session, ride_request: RideRequestRecord
) -> RideRequestRecord:
    """Persist a new ride request and return it."""
    database_session.add(ride_request)
    database_session.commit()
    database_session.refresh(ride_request)
    return ride_request


def get_ride_request_by_id(
    database_session: Session, ride_request_id: str, organization_id: str
) -> RideRequestRecord | None:
    """Return a ride request scoped to the organization."""
    return (
        database_session.query(RideRequestRecord)
        .filter(
            RideRequestRecord.id == ride_request_id,
            RideRequestRecord.organization_id == organization_id,
        )
        .first()
    )


def list_pending_ride_requests_for_date(
    *,
    database_session: Session,
    organization_id: str,
    travel_date: date,
    excluded_passenger_employee_id: str,
) -> list[RideRequestRecord]:
    """Return pending requests on a date, excluding the given passenger."""
    return (
        database_session.query(RideRequestRecord)
        .filter(
            RideRequestRecord.organization_id == organization_id,
            RideRequestRecord.travel_date == travel_date,
            RideRequestRecord.status == RideRequestStatus.PENDING.value,
            RideRequestRecord.passenger_employee_id
            != excluded_passenger_employee_id,
        )
        .order_by(RideRequestRecord.departure_time.asc())
        .all()
    )


def list_ride_requests_for_passenger(
    *,
    database_session: Session,
    organization_id: str,
    passenger_employee_id: str,
) -> list[RideRequestRecord]:
    """Return all ride requests raised by a passenger, newest first."""
    return (
        database_session.query(RideRequestRecord)
        .filter(
            RideRequestRecord.organization_id == organization_id,
            RideRequestRecord.passenger_employee_id == passenger_employee_id,
        )
        .order_by(RideRequestRecord.created_at.desc())
        .all()
    )


def claim_pending_ride_request(
    *, database_session: Session, ride_request_id: str
) -> bool:
    """Atomically move a request from PENDING to MATCHED.

    Returns True if this call performed the transition, False if the
    request was already claimed by someone else. Does not commit; the
    caller commits the surrounding booking transaction.
    """
    updated_row_count = (
        database_session.query(RideRequestRecord)
        .filter(
            RideRequestRecord.id == ride_request_id,
            RideRequestRecord.status == RideRequestStatus.PENDING.value,
        )
        .update(
            {RideRequestRecord.status: RideRequestStatus.MATCHED.value},
            synchronize_session=False,
        )
    )
    return updated_row_count == 1


# ── Ride offers ───────────────────────────────────────────────────────

def insert_ride_offer(
    database_session: Session, ride_offer: RideOfferRecord
) -> RideOfferRecord:
    """Persist a new ride offer and return it."""
    database_session.add(ride_offer)
    database_session.commit()
    database_session.refresh(ride_offer)
    return ride_offer


def get_ride_offer_by_id(
    database_session: Session, ride_offer_id: str, organization_id: str
) -> RideOfferRecord | None:
    """Return a ride offer scoped to the organization."""
    return (
        database_session.query(RideOfferRecord)
        .filter(
            RideOfferRecord.id == ride_offer_id,
            RideOfferRecord.organization_id == organization_id,
        )
        .first()
    )


def list_open_ride_offers_for_date(
    *,
    database_session: Session,
    organization_id: str,
    travel_date: date,
    minimum_seats_available: int,
    excluded_driver_employee_id: str,
) -> list[RideOfferRecord]:
    """Return open offers on a date with enough seats, excluding the driver."""
    return (
        database_session.query(RideOfferRecord)
        .filter(
            RideOfferRecord.organization_id == organization_id,
            RideOfferRecord.travel_date == travel_date,
            RideOfferRecord.journey_status == RideOfferJourneyStatus.OPEN.value,
            RideOfferRecord.seats_available >= minimum_seats_available,
            RideOfferRecord.driver_employee_id != excluded_driver_employee_id,
        )
        .order_by(RideOfferRecord.departure_window_start_time.asc())
        .all()
    )


def list_ride_offers_for_driver(
    *,
    database_session: Session,
    organization_id: str,
    driver_employee_id: str,
    journey_statuses: list[str] | None = None,
) -> list[RideOfferRecord]:
    """Return a driver's offers, optionally filtered by journey status."""
    query = database_session.query(RideOfferRecord).filter(
        RideOfferRecord.organization_id == organization_id,
        RideOfferRecord.driver_employee_id == driver_employee_id,
    )
    if journey_statuses is not None:
        query = query.filter(RideOfferRecord.journey_status.in_(journey_statuses))
    return query.order_by(RideOfferRecord.created_at.desc()).all()


def reserve_offer_seats(
    *, database_session: Session, ride_offer_id: str, seats_to_reserve: int
) -> bool:
    """Atomically decrement available seats if enough remain.

    Returns True if the seats were reserved, False if insufficient seats.
    Does not commit; the caller owns the transaction.
    """
    updated_row_count = (
        database_session.query(RideOfferRecord)
        .filter(
            RideOfferRecord.id == ride_offer_id,
            RideOfferRecord.seats_available >= seats_to_reserve,
        )
        .update(
            {
                RideOfferRecord.seats_available: RideOfferRecord.seats_available
                - seats_to_reserve
            },
            synchronize_session=False,
        )
    )
    return updated_row_count == 1


# ── Bookings ──────────────────────────────────────────────────────────

def insert_ride_booking(
    database_session: Session, ride_booking: RideBookingRecord
) -> None:
    """Stage a booking for insertion within the caller's transaction."""
    database_session.add(ride_booking)


def get_ride_booking_by_id(
    database_session: Session, ride_booking_id: str, organization_id: str
) -> RideBookingRecord | None:
    """Return a booking scoped to the organization."""
    return (
        database_session.query(RideBookingRecord)
        .filter(
            RideBookingRecord.id == ride_booking_id,
            RideBookingRecord.organization_id == organization_id,
        )
        .first()
    )


def list_bookings_for_passenger(
    *,
    database_session: Session,
    organization_id: str,
    passenger_employee_id: str,
    trip_statuses: list[str] | None = None,
) -> list[RideBookingRecord]:
    """Return a passenger's bookings, optionally filtered by trip status."""
    query = database_session.query(RideBookingRecord).filter(
        RideBookingRecord.organization_id == organization_id,
        RideBookingRecord.passenger_employee_id == passenger_employee_id,
    )
    if trip_statuses is not None:
        query = query.filter(RideBookingRecord.trip_status.in_(trip_statuses))
    return query.order_by(RideBookingRecord.created_at.desc()).all()


def list_bookings_for_driver(
    *,
    database_session: Session,
    organization_id: str,
    driver_employee_id: str,
    trip_statuses: list[str] | None = None,
) -> list[RideBookingRecord]:
    """Return bookings where the employee is the driver, optionally filtered."""
    query = database_session.query(RideBookingRecord).filter(
        RideBookingRecord.organization_id == organization_id,
        RideBookingRecord.driver_employee_id == driver_employee_id,
    )
    if trip_statuses is not None:
        query = query.filter(RideBookingRecord.trip_status.in_(trip_statuses))
    return query.order_by(RideBookingRecord.created_at.desc()).all()


def list_bookings_for_offer(
    *, database_session: Session, ride_offer_id: str
) -> list[RideBookingRecord]:
    """Return every booking attached to an offer."""
    return (
        database_session.query(RideBookingRecord)
        .filter(RideBookingRecord.ride_offer_id == ride_offer_id)
        .all()
    )


# ── Live location pings ───────────────────────────────────────────────

def insert_location_ping(
    database_session: Session, location_ping: LiveLocationPingRecord
) -> LiveLocationPingRecord:
    """Persist a driver location ping and return it."""
    database_session.add(location_ping)
    database_session.commit()
    database_session.refresh(location_ping)
    return location_ping


def get_latest_location_ping_for_offer(
    *, database_session: Session, ride_offer_id: str
) -> LiveLocationPingRecord | None:
    """Return the most recent location ping for an offer's journey."""
    return (
        database_session.query(LiveLocationPingRecord)
        .filter(LiveLocationPingRecord.ride_offer_id == ride_offer_id)
        .order_by(LiveLocationPingRecord.recorded_at.desc())
        .first()
    )
