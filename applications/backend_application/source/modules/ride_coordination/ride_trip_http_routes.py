"""HTTP routes for trip lifecycle, booking lists, and live tracking."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from source.application_startup.database_connection import get_database_session
from source.modules.employee_management.employee_record_model import EmployeeRecord
from source.modules.employee_management.current_employee_http_dependency import (
    resolve_current_employee,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideRequestStatus,
    RideOfferJourneyStatus,
    RideBookingTripStatus,
)
from source.modules.ride_coordination.geospatial_distance_calculation import (
    calculate_straight_line_distance_kilometers,
)
from source.modules.ride_coordination.ride_coordination_repository import (
    get_ride_offer_by_id,
    get_ride_request_by_id,
    get_ride_booking_by_id,
    list_bookings_for_passenger,
    list_bookings_for_driver,
)
from source.modules.ride_coordination.ride_booking_service import (
    accept_requests_onto_offer,
)
from source.modules.ride_coordination.trip_lifecycle_service import (
    start_journey,
    verify_booking_otp_and_start_trip,
    complete_booking_trip,
    complete_journey,
    cancel_booking,
    cancel_ride_offer,
    record_driver_location,
    get_latest_driver_location,
    JourneyNotStartableError,
    JourneyNotActiveError,
    IncorrectBookingOtpError,
    BookingNotAwaitingPickupError,
    BookingNotCancellableError,
    JourneyNotCancellableError,
    JourneyTooCloseToDepartureError,
)
from source.modules.ride_coordination.ride_view_assembly import (
    build_ride_booking_response,
    build_booking_tracking_response,
)
from source.modules.ride_coordination.ride_coordination_contracts import (
    AcceptRideRequestsRequest,
    AcceptRideRequestsResponse,
    RideBookingResponse,
    RideOfferResponse,
    VerifyBookingOtpRequest,
    PostDriverLocationRequest,
    DriverLocationResponse,
    BookingTrackingResponse,
    EmployeeRideReportSummaryResponse,
)

ride_trip_router = APIRouter(
    prefix="/api/v1/rides",
    tags=["Ride Trips"],
)


def _load_offer_owned_by_driver(
    *, database_session: Session, ride_offer_id: str, employee: EmployeeRecord
):
    """Fetch an offer and confirm the current employee is its driver."""
    ride_offer = get_ride_offer_by_id(
        database_session, ride_offer_id, employee.organization_id
    )
    if ride_offer is None or ride_offer.driver_employee_id != employee.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ride offer not found"
        )
    return ride_offer


def _load_booking_for_participant(
    *, database_session: Session, ride_booking_id: str, employee: EmployeeRecord
):
    """Fetch a booking the current employee participates in (driver or passenger)."""
    ride_booking = get_ride_booking_by_id(
        database_session, ride_booking_id, employee.organization_id
    )
    if ride_booking is None or employee.id not in (
        ride_booking.driver_employee_id,
        ride_booking.passenger_employee_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
        )
    return ride_booking


def _estimate_booking_distance_kilometers(
    *, database_session: Session, employee: EmployeeRecord, ride_booking
) -> float:
    """Return the booking distance from its request estimate or coordinates."""
    ride_request = get_ride_request_by_id(
        database_session, ride_booking.ride_request_id, employee.organization_id
    )
    if (
        ride_request is not None
        and ride_request.estimated_distance_kilometers is not None
    ):
        return float(ride_request.estimated_distance_kilometers)

    return calculate_straight_line_distance_kilometers(
        first_latitude=ride_booking.pickup_latitude,
        first_longitude=ride_booking.pickup_longitude,
        second_latitude=ride_booking.drop_latitude,
        second_longitude=ride_booking.drop_longitude,
    )


def _list_completed_bookings_for_employee(
    *, database_session: Session, employee: EmployeeRecord
):
    """Return completed bookings where the employee is passenger or driver."""
    completed_statuses = [RideBookingTripStatus.COMPLETED.value]
    passenger_bookings = list_bookings_for_passenger(
        database_session=database_session,
        organization_id=employee.organization_id,
        passenger_employee_id=employee.id,
        trip_statuses=completed_statuses,
    )
    driver_bookings = list_bookings_for_driver(
        database_session=database_session,
        organization_id=employee.organization_id,
        driver_employee_id=employee.id,
        trip_statuses=completed_statuses,
    )
    unique_bookings = {
        booking.id: booking for booking in [*passenger_bookings, *driver_bookings]
    }
    return list(unique_bookings.values())


# ── Driver accepts matching requests (Offer flow 2C) ──────────────────

@ride_trip_router.post(
    "/offers/accept",
    response_model=AcceptRideRequestsResponse,
    summary="Driver accepts matching requests onto an offer (screen 2C)",
)
def accept_ride_requests(
    request: AcceptRideRequestsRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Accept one or more pending requests onto the driver's open offer."""
    ride_offer = _load_offer_owned_by_driver(
        database_session=database_session,
        ride_offer_id=request.ride_offer_id,
        employee=employee,
    )
    if ride_offer.journey_status != RideOfferJourneyStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This offer is no longer accepting requests",
        )

    ride_requests = []
    for ride_request_id in request.ride_request_ids:
        ride_request = get_ride_request_by_id(
            database_session, ride_request_id, employee.organization_id
        )
        if ride_request is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ride request {ride_request_id} not found",
            )
        if ride_request.status == RideRequestStatus.PENDING.value:
            ride_requests.append(ride_request)

    created_bookings = accept_requests_onto_offer(
        database_session=database_session,
        ride_offer=ride_offer,
        ride_requests=ride_requests,
    )
    booking_responses = [
        build_ride_booking_response(
            database_session=database_session,
            organization_id=employee.organization_id,
            ride_booking=booking,
            include_otp_code=False,
        )
        for booking in created_bookings
    ]
    return AcceptRideRequestsResponse(bookings=booking_responses)


# ── Booking lists (Upcoming / Ongoing) ────────────────────────────────

@ride_trip_router.get(
    "/bookings/as-passenger",
    response_model=list[RideBookingResponse],
    summary="My bookings as a passenger (Upcoming/Ongoing rides)",
)
def list_my_passenger_bookings(
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return the current employee's bookings as a passenger, OTP included."""
    bookings = list_bookings_for_passenger(
        database_session=database_session,
        organization_id=employee.organization_id,
        passenger_employee_id=employee.id,
    )
    return [
        build_ride_booking_response(
            database_session=database_session,
            organization_id=employee.organization_id,
            ride_booking=booking,
            include_otp_code=True,
        )
        for booking in bookings
    ]


@ride_trip_router.get(
    "/bookings/as-driver",
    response_model=list[RideBookingResponse],
    summary="My bookings as a driver (Upcoming journeys' passengers)",
)
def list_my_driver_bookings(
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return the current employee's bookings as a driver, OTP withheld."""
    bookings = list_bookings_for_driver(
        database_session=database_session,
        organization_id=employee.organization_id,
        driver_employee_id=employee.id,
    )
    return [
        build_ride_booking_response(
            database_session=database_session,
            organization_id=employee.organization_id,
            ride_booking=booking,
            include_otp_code=False,
        )
        for booking in bookings
    ]


# ── Trip lifecycle ────────────────────────────────────────────────────

@ride_trip_router.get(
    "/history",
    response_model=list[RideBookingResponse],
    summary="Completed rides for the authenticated employee",
)
def list_my_ride_history(
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return completed bookings where the employee was passenger or driver."""
    completed_bookings = _list_completed_bookings_for_employee(
        database_session=database_session, employee=employee
    )
    return [
        build_ride_booking_response(
            database_session=database_session,
            organization_id=employee.organization_id,
            ride_booking=booking,
            include_otp_code=booking.passenger_employee_id == employee.id,
        )
        for booking in completed_bookings
    ]


@ride_trip_router.get(
    "/reports/summary",
    response_model=EmployeeRideReportSummaryResponse,
    summary="Employee ride report summary",
)
def get_my_ride_report_summary(
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return employee-specific analytics derived from completed bookings."""
    completed_bookings = _list_completed_bookings_for_employee(
        database_session=database_session, employee=employee
    )

    total_distance_kilometers = sum(
        _estimate_booking_distance_kilometers(
            database_session=database_session,
            employee=employee,
            ride_booking=booking,
        )
        for booking in completed_bookings
    )
    passenger_spend_amount = sum(
        booking.fare_amount
        for booking in completed_bookings
        if booking.passenger_employee_id == employee.id
    )
    driver_earning_amount = sum(
        booking.fare_amount
        for booking in completed_bookings
        if booking.driver_employee_id == employee.id
    )
    seats_shared_as_driver = sum(
        booking.seats_booked
        for booking in completed_bookings
        if booking.driver_employee_id == employee.id
    )
    total_fare_amount = passenger_spend_amount + driver_earning_amount
    completed_trip_count = len(completed_bookings)

    return EmployeeRideReportSummaryResponse(
        completed_trips=completed_trip_count,
        total_distance_kilometers=round(total_distance_kilometers, 2),
        total_fare_amount=round(total_fare_amount, 2),
        passenger_spend_amount=round(passenger_spend_amount, 2),
        driver_earning_amount=round(driver_earning_amount, 2),
        seats_shared_as_driver=seats_shared_as_driver,
        average_fare_per_trip=(
            round(total_fare_amount / completed_trip_count, 2)
            if completed_trip_count > 0
            else 0
        ),
    )


@ride_trip_router.post(
    "/offers/{ride_offer_id}/start",
    response_model=RideOfferResponse,
    summary="Driver starts the journey (Start ride, screen 2C/1D)",
)
def start_ride_journey(
    ride_offer_id: str,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Begin the driver's journey so tracking and pickups can proceed."""
    ride_offer = _load_offer_owned_by_driver(
        database_session=database_session,
        ride_offer_id=ride_offer_id,
        employee=employee,
    )
    try:
        ride_offer = start_journey(
            database_session=database_session, ride_offer=ride_offer
        )
    except JourneyNotStartableError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This journey cannot be started in its current state",
        )
    return RideOfferResponse.model_validate(ride_offer)


@ride_trip_router.post(
    "/offers/{ride_offer_id}/cancel",
    response_model=RideOfferResponse,
    summary="Driver withdraws their offered journey before it starts",
)
def cancel_my_ride_offer(
    ride_offer_id: str,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Cancel the driver's own offer and every booking still awaiting pickup."""
    ride_offer = _load_offer_owned_by_driver(
        database_session=database_session,
        ride_offer_id=ride_offer_id,
        employee=employee,
    )
    try:
        ride_offer = cancel_ride_offer(
            database_session=database_session, ride_offer=ride_offer
        )
    except JourneyNotCancellableError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This journey can no longer be cancelled",
        )
    except JourneyTooCloseToDepartureError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Rides can only be cancelled at least 2 hours before departure",
        )
    return RideOfferResponse.model_validate(ride_offer)


@ride_trip_router.post(
    "/bookings/{ride_booking_id}/verify-otp",
    response_model=RideBookingResponse,
    summary="Driver verifies a passenger's OTP at pickup (screen 1D)",
)
def verify_booking_otp(
    ride_booking_id: str,
    request: VerifyBookingOtpRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Verify the passenger OTP and start that passenger's trip."""
    ride_booking = _load_booking_for_participant(
        database_session=database_session,
        ride_booking_id=ride_booking_id,
        employee=employee,
    )
    if ride_booking.driver_employee_id != employee.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the driver can verify the pickup OTP",
        )
    ride_offer = get_ride_offer_by_id(
        database_session, ride_booking.ride_offer_id, employee.organization_id
    )
    try:
        ride_booking = verify_booking_otp_and_start_trip(
            database_session=database_session,
            ride_offer=ride_offer,
            ride_booking=ride_booking,
            submitted_otp_code=request.otp_code,
        )
    except JourneyNotActiveError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Start the journey before verifying pickup OTPs",
        )
    except BookingNotAwaitingPickupError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This booking is not awaiting pickup",
        )
    except IncorrectBookingOtpError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect OTP"
        )
    return build_ride_booking_response(
        database_session=database_session,
        organization_id=employee.organization_id,
        ride_booking=ride_booking,
        include_otp_code=False,
    )


@ride_trip_router.post(
    "/bookings/{ride_booking_id}/complete",
    response_model=RideBookingResponse,
    summary="Driver marks a passenger dropped at destination",
)
def complete_booking(
    ride_booking_id: str,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Complete a single passenger's trip on drop-off."""
    ride_booking = _load_booking_for_participant(
        database_session=database_session,
        ride_booking_id=ride_booking_id,
        employee=employee,
    )
    if ride_booking.driver_employee_id != employee.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the driver can complete a trip",
        )
    ride_booking = complete_booking_trip(
        database_session=database_session, ride_booking=ride_booking
    )
    return build_ride_booking_response(
        database_session=database_session,
        organization_id=employee.organization_id,
        ride_booking=ride_booking,
        include_otp_code=False,
    )


@ride_trip_router.post(
    "/bookings/{ride_booking_id}/cancel",
    response_model=RideBookingResponse,
    summary="Passenger cancels their booking before pickup",
)
def cancel_ride_booking(
    ride_booking_id: str,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Cancel the current employee's own booking and free its seat."""
    ride_booking = _load_booking_for_participant(
        database_session=database_session,
        ride_booking_id=ride_booking_id,
        employee=employee,
    )
    if ride_booking.passenger_employee_id != employee.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the passenger can cancel this booking",
        )
    ride_offer = get_ride_offer_by_id(
        database_session, ride_booking.ride_offer_id, employee.organization_id
    )
    try:
        ride_booking = cancel_booking(
            database_session=database_session,
            ride_offer=ride_offer,
            ride_booking=ride_booking,
        )
    except BookingNotCancellableError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This booking can no longer be cancelled",
        )
    return build_ride_booking_response(
        database_session=database_session,
        organization_id=employee.organization_id,
        ride_booking=ride_booking,
        include_otp_code=True,
    )


@ride_trip_router.post(
    "/offers/{ride_offer_id}/complete",
    response_model=RideOfferResponse,
    summary="Driver completes the whole journey",
)
def complete_ride_journey(
    ride_offer_id: str,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Complete the journey and settle all of its trips."""
    ride_offer = _load_offer_owned_by_driver(
        database_session=database_session,
        ride_offer_id=ride_offer_id,
        employee=employee,
    )
    ride_offer = complete_journey(
        database_session=database_session, ride_offer=ride_offer
    )
    return RideOfferResponse.model_validate(ride_offer)


# ── Live tracking ─────────────────────────────────────────────────────

@ride_trip_router.post(
    "/offers/{ride_offer_id}/location",
    response_model=DriverLocationResponse,
    summary="Driver posts current location (every ~5s during a journey)",
)
def post_driver_location(
    ride_offer_id: str,
    request: PostDriverLocationRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Record the driver's current GPS position for an active journey."""
    ride_offer = _load_offer_owned_by_driver(
        database_session=database_session,
        ride_offer_id=ride_offer_id,
        employee=employee,
    )
    try:
        location_ping = record_driver_location(
            database_session=database_session,
            ride_offer=ride_offer,
            latitude=request.latitude,
            longitude=request.longitude,
        )
    except JourneyNotActiveError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Location can only be posted while the journey is active",
        )
    return DriverLocationResponse(
        ride_offer_id=location_ping.ride_offer_id,
        latitude=location_ping.latitude,
        longitude=location_ping.longitude,
        recorded_at=location_ping.recorded_at,
    )


@ride_trip_router.get(
    "/bookings/{ride_booking_id}/tracking",
    response_model=BookingTrackingResponse,
    summary="Poll live tracking for a booking (every ~5s)",
)
def get_booking_tracking(
    ride_booking_id: str,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return the latest driver location and trip status for a booking."""
    ride_booking = _load_booking_for_participant(
        database_session=database_session,
        ride_booking_id=ride_booking_id,
        employee=employee,
    )
    latest_location_ping = get_latest_driver_location(
        database_session=database_session, ride_offer_id=ride_booking.ride_offer_id
    )
    return build_booking_tracking_response(
        database_session=database_session,
        organization_id=employee.organization_id,
        ride_booking=ride_booking,
        latest_location_ping=latest_location_ping,
    )
