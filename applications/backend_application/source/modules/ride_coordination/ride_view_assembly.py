"""Assembles enriched API responses from ride records.

Ride records store identifiers; the employee application needs human
details (driver and passenger names, vehicle description). This module
resolves those through the employee and vehicle public interfaces and
builds the response contracts, keeping enrichment out of the HTTP routes
and the core services.
"""

from sqlalchemy.orm import Session

from source.modules.employee_management.public_interface import (
    retrieve_employee_by_id_within_organization,
)
from source.modules.vehicle_management.public_interface import (
    retrieve_vehicle_by_id,
)
from source.modules.vehicle_management.vehicle_record_model import VehicleRecord
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
from source.modules.ride_coordination.ride_matching_service import (
    MatchedOffer,
    MatchedRequest,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideOfferJourneyStatus,
)
from source.modules.ride_coordination.ride_coordination_repository import (
    get_ride_request_by_id,
    get_ride_offer_by_id,
)
from source.modules.ride_coordination.ride_coordination_contracts import (
    MatchingOfferResponse,
    MatchingRequestResponse,
    RideBookingResponse,
    BookingTrackingResponse,
    DriverLocationResponse,
)

_UNKNOWN_PERSON_NAME = "Unknown"
_UNKNOWN_VEHICLE_DESCRIPTION = "Unknown vehicle"
_UNKNOWN_VEHICLE_NUMBER = "—"


def _format_vehicle_make_and_model(vehicle: VehicleRecord | None) -> str:
    """Combine make and model into one display string."""
    if vehicle is None:
        return _UNKNOWN_VEHICLE_DESCRIPTION
    return f"{vehicle.make} {vehicle.model}".strip()


def _employee_full_name(
    *, database_session: Session, organization_id: str, employee_id: str
) -> str:
    """Resolve an employee's full name, or a placeholder if missing."""
    employee = retrieve_employee_by_id_within_organization(
        database_session=database_session,
        employee_id=employee_id,
        organization_id=organization_id,
    )
    return employee.full_name if employee is not None else _UNKNOWN_PERSON_NAME


def build_matching_offer_response(
    *, database_session: Session, organization_id: str, matched_offer: MatchedOffer
) -> MatchingOfferResponse:
    """Build the passenger-facing view of a matching offer."""
    offer = matched_offer.offer
    driver = retrieve_employee_by_id_within_organization(
        database_session=database_session,
        employee_id=offer.driver_employee_id,
        organization_id=organization_id,
    )
    vehicle = retrieve_vehicle_by_id(
        database_session=database_session,
        organization_id=organization_id,
        vehicle_id=offer.vehicle_id,
    )
    return MatchingOfferResponse(
        ride_offer_id=offer.id,
        driver_full_name=driver.full_name if driver else _UNKNOWN_PERSON_NAME,
        driver_designation=driver.designation if driver else None,
        vehicle_make_and_model=_format_vehicle_make_and_model(vehicle),
        vehicle_number=vehicle.vehicle_number if vehicle else _UNKNOWN_VEHICLE_NUMBER,
        source_latitude=offer.source_latitude,
        source_longitude=offer.source_longitude,
        source_label=offer.source_label,
        destination_latitude=offer.destination_latitude,
        destination_longitude=offer.destination_longitude,
        destination_label=offer.destination_label,
        travel_date=offer.travel_date,
        departure_window_start_time=offer.departure_window_start_time,
        departure_window_end_time=offer.departure_window_end_time,
        seats_available=offer.seats_available,
        fare_amount=matched_offer.fare_amount,
        pickup_distance_kilometers=matched_offer.pickup_distance_kilometers,
        drop_distance_kilometers=matched_offer.drop_distance_kilometers,
    )


def build_matching_request_response(
    *,
    database_session: Session,
    organization_id: str,
    matched_request: MatchedRequest,
) -> MatchingRequestResponse:
    """Build the driver-facing view of a matching request."""
    request = matched_request.request
    return MatchingRequestResponse(
        ride_request_id=request.id,
        passenger_full_name=_employee_full_name(
            database_session=database_session,
            organization_id=organization_id,
            employee_id=request.passenger_employee_id,
        ),
        source_latitude=request.source_latitude,
        source_longitude=request.source_longitude,
        source_label=request.source_label,
        destination_latitude=request.destination_latitude,
        destination_longitude=request.destination_longitude,
        destination_label=request.destination_label,
        travel_date=request.travel_date,
        departure_time=request.departure_time,
        seats_requested=request.seats_requested,
        fare_amount=matched_request.fare_amount,
        pickup_distance_kilometers=matched_request.pickup_distance_kilometers,
        drop_distance_kilometers=matched_request.drop_distance_kilometers,
    )


def build_ride_booking_response(
    *,
    database_session: Session,
    organization_id: str,
    ride_booking: RideBookingRecord,
    include_otp_code: bool,
) -> RideBookingResponse:
    """Build a booking view; the OTP is included only for its passenger."""
    ride_request = get_ride_request_by_id(
        database_session, ride_booking.ride_request_id, organization_id
    )
    ride_offer = get_ride_offer_by_id(
        database_session, ride_booking.ride_offer_id, organization_id
    )
    driver = retrieve_employee_by_id_within_organization(
        database_session=database_session,
        employee_id=ride_booking.driver_employee_id,
        organization_id=organization_id,
    )
    passenger = retrieve_employee_by_id_within_organization(
        database_session=database_session,
        employee_id=ride_booking.passenger_employee_id,
        organization_id=organization_id,
    )
    vehicle = (
        retrieve_vehicle_by_id(
            database_session=database_session,
            organization_id=organization_id,
            vehicle_id=ride_offer.vehicle_id,
        )
        if ride_offer is not None
        else None
    )
    return RideBookingResponse(
        id=ride_booking.id,
        ride_request_id=ride_booking.ride_request_id,
        ride_offer_id=ride_booking.ride_offer_id,
        trip_status=ride_booking.trip_status,
        ride_offer_journey_status=(
            ride_offer.journey_status
            if ride_offer is not None
            else RideOfferJourneyStatus.CANCELLED.value
        ),
        ride_offer_departure_window_start_time=(
            ride_offer.departure_window_start_time if ride_offer is not None else None
        ),
        seats_booked=ride_booking.seats_booked,
        fare_amount=ride_booking.fare_amount,
        payment_status=ride_booking.payment_status,
        otp_code=ride_booking.otp_code if include_otp_code else None,
        is_otp_verified=ride_booking.is_otp_verified,
        travel_date=ride_offer.travel_date if ride_offer else ride_request.travel_date,
        departure_time=(
            ride_request.departure_time if ride_request else ""
        ),
        pickup_latitude=ride_booking.pickup_latitude,
        pickup_longitude=ride_booking.pickup_longitude,
        pickup_label=ride_request.source_label if ride_request else None,
        drop_latitude=ride_booking.drop_latitude,
        drop_longitude=ride_booking.drop_longitude,
        drop_label=ride_request.destination_label if ride_request else None,
        driver_full_name=driver.full_name if driver else _UNKNOWN_PERSON_NAME,
        driver_phone=driver.phone if driver else None,
        passenger_full_name=(
            passenger.full_name if passenger else _UNKNOWN_PERSON_NAME
        ),
        vehicle_make_and_model=_format_vehicle_make_and_model(vehicle),
        vehicle_number=vehicle.vehicle_number if vehicle else _UNKNOWN_VEHICLE_NUMBER,
        created_at=ride_booking.created_at,
        started_at=ride_booking.started_at,
        completed_at=ride_booking.completed_at,
    )


def build_booking_tracking_response(
    *,
    database_session: Session,
    organization_id: str,
    ride_booking: RideBookingRecord,
    latest_location_ping: LiveLocationPingRecord | None,
) -> BookingTrackingResponse:
    """Build the live-tracking payload a passenger polls for their booking."""
    ride_offer = get_ride_offer_by_id(
        database_session, ride_booking.ride_offer_id, organization_id
    )
    vehicle = (
        retrieve_vehicle_by_id(
            database_session=database_session,
            organization_id=organization_id,
            vehicle_id=ride_offer.vehicle_id,
        )
        if ride_offer is not None
        else None
    )
    driver_location = (
        DriverLocationResponse(
            ride_offer_id=latest_location_ping.ride_offer_id,
            latitude=latest_location_ping.latitude,
            longitude=latest_location_ping.longitude,
            recorded_at=latest_location_ping.recorded_at,
        )
        if latest_location_ping is not None
        else None
    )
    return BookingTrackingResponse(
        booking_id=ride_booking.id,
        trip_status=ride_booking.trip_status,
        driver_location=driver_location,
        pickup_latitude=ride_booking.pickup_latitude,
        pickup_longitude=ride_booking.pickup_longitude,
        drop_latitude=ride_booking.drop_latitude,
        drop_longitude=ride_booking.drop_longitude,
        driver_full_name=_employee_full_name(
            database_session=database_session,
            organization_id=organization_id,
            employee_id=ride_booking.driver_employee_id,
        ),
        vehicle_make_and_model=_format_vehicle_make_and_model(vehicle),
        vehicle_number=vehicle.vehicle_number if vehicle else _UNKNOWN_VEHICLE_NUMBER,
    )
