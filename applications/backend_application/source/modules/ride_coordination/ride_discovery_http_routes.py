"""HTTP routes for ride discovery: fare, Find a Ride, Offer a Ride, booking."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from source.application_startup.database_connection import get_database_session
from source.application_startup.application_configuration import (
    ApplicationConfiguration,
    create_application_configuration,
)
from source.modules.employee_management.employee_record_model import EmployeeRecord
from source.modules.employee_management.current_employee_http_dependency import (
    resolve_current_employee,
)
from source.modules.company_settings.company_settings_record_model import (
    CompanySettingsRecord,
)
from source.modules.company_settings.public_interface import retrieve_company_settings
from source.modules.vehicle_management.public_interface import (
    retrieve_vehicle_for_owner_by_id,
)
from source.modules.ride_coordination.ride_request_record_model import (
    RideRequestRecord,
)
from source.modules.ride_coordination.ride_offer_record_model import RideOfferRecord
from source.modules.ride_coordination.ride_notification_dispatch import (
    notify_booking_confirmed_safely,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideRequestStatus,
    RideOfferJourneyStatus,
)
from source.modules.ride_coordination.route_distance_service import (
    estimate_driving_distance_kilometers,
)
from source.modules.ride_coordination.fare_calculation_service import (
    calculate_ride_fare_amount,
)
from source.modules.ride_coordination.ride_matching_service import (
    find_offers_matching_request,
    find_requests_matching_offer,
)
from source.modules.ride_coordination.ride_booking_service import (
    book_offer_for_request,
    RideRequestNoLongerAvailableError,
    RideOfferSeatsUnavailableError,
)
from source.modules.ride_coordination.ride_coordination_repository import (
    insert_ride_request,
    insert_ride_offer,
    get_ride_request_by_id,
    get_ride_offer_by_id,
    list_ride_requests_for_passenger,
    list_ride_offers_for_driver,
)
from source.modules.ride_coordination.ride_view_assembly import (
    build_matching_offer_response,
    build_matching_request_response,
    build_ride_booking_response,
)
from source.modules.ride_coordination.ride_coordination_contracts import (
    FareEstimateRequest,
    FareEstimateResponse,
    CreateRideRequestRequest,
    CreateRideRequestResponse,
    RideRequestResponse,
    BookRideOfferRequest,
    RideBookingResponse,
    CreateRideOfferRequest,
    CreateRideOfferResponse,
    RideOfferResponse,
)

ride_discovery_router = APIRouter(
    prefix="/api/v1/rides",
    tags=["Ride Discovery"],
)


def _require_company_settings(
    *, database_session: Session, organization_id: str
) -> CompanySettingsRecord:
    """Load the organization's carpooling settings or fail with a clear error."""
    settings = retrieve_company_settings(
        organization_id=organization_id, database_session=database_session
    )
    if settings is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Company carpooling settings are not configured",
        )
    return settings


def _encode_recurrence_days(recurrence_days: list[str] | None) -> str | None:
    """Encode a list of weekday codes as a comma-separated string."""
    if not recurrence_days:
        return None
    return ",".join(recurrence_days)


@ride_discovery_router.post(
    "/fare-estimate",
    response_model=FareEstimateResponse,
    summary="Estimate the fare for a trip before confirming (screen 1B)",
)
def estimate_fare(
    request: FareEstimateRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
    configuration: ApplicationConfiguration = Depends(create_application_configuration),
):
    """Return the server-authoritative fare for a source-to-destination trip."""
    settings = _require_company_settings(
        database_session=database_session, organization_id=employee.organization_id
    )
    distance_kilometers = estimate_driving_distance_kilometers(
        source_latitude=request.source.latitude,
        source_longitude=request.source.longitude,
        destination_latitude=request.destination.latitude,
        destination_longitude=request.destination.longitude,
        google_maps_api_key=configuration.google_maps_api_key,
    )
    fare_amount = calculate_ride_fare_amount(
        distance_kilometers=distance_kilometers,
        travel_cost_per_kilometer=settings.travel_cost_per_kilometer,
        seats_requested=request.seats_requested,
    )
    return FareEstimateResponse(
        distance_kilometers=distance_kilometers,
        fare_amount=fare_amount,
        currency=settings.default_currency,
    )


@ride_discovery_router.post(
    "/requests",
    response_model=CreateRideRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a ride request and return matching offers (screens 1B.1/1B.2)",
)
def create_ride_request(
    request: CreateRideRequestRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
    configuration: ApplicationConfiguration = Depends(create_application_configuration),
):
    """Persist a passenger request, compute fare, and list matching offers."""
    settings = _require_company_settings(
        database_session=database_session, organization_id=employee.organization_id
    )
    distance_kilometers = estimate_driving_distance_kilometers(
        source_latitude=request.source.latitude,
        source_longitude=request.source.longitude,
        destination_latitude=request.destination.latitude,
        destination_longitude=request.destination.longitude,
        google_maps_api_key=configuration.google_maps_api_key,
    )
    fare_amount = calculate_ride_fare_amount(
        distance_kilometers=distance_kilometers,
        travel_cost_per_kilometer=settings.travel_cost_per_kilometer,
        seats_requested=request.seats_requested,
    )

    ride_request = RideRequestRecord(
        organization_id=employee.organization_id,
        passenger_employee_id=employee.id,
        source_latitude=request.source.latitude,
        source_longitude=request.source.longitude,
        source_label=request.source.label,
        destination_latitude=request.destination.latitude,
        destination_longitude=request.destination.longitude,
        destination_label=request.destination.label,
        travel_date=request.travel_date,
        departure_time=request.departure_time,
        seats_requested=request.seats_requested,
        is_recurring=request.is_recurring,
        recurrence_days=_encode_recurrence_days(request.recurrence_days),
        recurrence_time=request.recurrence_time,
        estimated_distance_kilometers=distance_kilometers,
        estimated_fare_amount=fare_amount,
    )
    ride_request = insert_ride_request(database_session, ride_request)

    matched_offers = find_offers_matching_request(
        database_session=database_session,
        ride_request=ride_request,
        pickup_match_radius_kilometers=settings.pickup_match_radius_kilometers,
        drop_match_radius_kilometers=settings.drop_match_radius_kilometers,
    )
    matching_offer_responses = [
        build_matching_offer_response(
            database_session=database_session,
            organization_id=employee.organization_id,
            matched_offer=matched_offer,
        )
        for matched_offer in matched_offers
    ]
    return CreateRideRequestResponse(
        ride_request=RideRequestResponse.model_validate(ride_request),
        matching_offers=matching_offer_responses,
    )


@ride_discovery_router.post(
    "/bookings",
    response_model=RideBookingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Book a matching offer for a request (Select Ride, screen 1C)",
)
def book_offer(
    request: BookRideOfferRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
    configuration: ApplicationConfiguration = Depends(
        create_application_configuration
    ),
):
    """Confirm a passenger's booking of a published offer."""
    ride_request = get_ride_request_by_id(
        database_session, request.ride_request_id, employee.organization_id
    )
    if ride_request is None or ride_request.passenger_employee_id != employee.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ride request not found"
        )
    if ride_request.status != RideRequestStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This request has already been matched",
        )

    ride_offer = get_ride_offer_by_id(
        database_session, request.ride_offer_id, employee.organization_id
    )
    if ride_offer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ride offer not found"
        )
    if ride_offer.journey_status != RideOfferJourneyStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This offer is no longer accepting bookings",
        )

    try:
        booking = book_offer_for_request(
            database_session=database_session,
            ride_request=ride_request,
            ride_offer=ride_offer,
        )
    except RideRequestNoLongerAvailableError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This request was just matched by another booking",
        )
    except RideOfferSeatsUnavailableError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This offer no longer has enough seats",
        )

    notify_booking_confirmed_safely(
        database_session=database_session,
        configuration=configuration,
        ride_booking=booking,
    )
    return build_ride_booking_response(
        database_session=database_session,
        organization_id=employee.organization_id,
        ride_booking=booking,
        include_otp_code=True,
    )


@ride_discovery_router.get(
    "/requests/mine",
    response_model=list[RideRequestResponse],
    summary="List my ride requests (Menu > Rides > Ride Requests)",
)
def list_my_ride_requests(
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return all ride requests raised by the current passenger."""
    ride_requests = list_ride_requests_for_passenger(
        database_session=database_session,
        organization_id=employee.organization_id,
        passenger_employee_id=employee.id,
    )
    return [RideRequestResponse.model_validate(record) for record in ride_requests]


@ride_discovery_router.post(
    "/requests/{ride_request_id}/cancel",
    response_model=RideRequestResponse,
    summary="Withdraw a pending ride request",
)
def cancel_my_ride_request(
    ride_request_id: str,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Withdraw the current passenger's own request while it is still pending.

    Once a request has been matched to an offer it is no longer withdrawn
    here — the resulting booking is cancelled through the booking cancel
    route instead.
    """
    ride_request = get_ride_request_by_id(
        database_session, ride_request_id, employee.organization_id
    )
    if ride_request is None or ride_request.passenger_employee_id != employee.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ride request not found"
        )
    if ride_request.status != RideRequestStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only a pending request can be withdrawn",
        )
    ride_request.status = RideRequestStatus.CANCELLED.value
    database_session.commit()
    database_session.refresh(ride_request)
    return RideRequestResponse.model_validate(ride_request)


@ride_discovery_router.post(
    "/offers",
    response_model=CreateRideOfferResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Publish a ride offer and return matching requests (screens 2B.1/2B.2)",
)
def create_ride_offer(
    request: CreateRideOfferRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Publish a driver offer and surface any matching passenger requests."""
    vehicle = retrieve_vehicle_for_owner_by_id(
        database_session=database_session,
        organization_id=employee.organization_id,
        owner_employee_id=employee.id,
        vehicle_id=request.vehicle_id,
    )
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found or not owned by you",
        )

    seats_total = request.seats_offered or vehicle.capacity
    if seats_total > vehicle.capacity:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Offered seats exceed the vehicle capacity",
        )
    if request.departure_window_end_time < request.departure_window_start_time:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Time window end must not be before its start",
        )

    settings = _require_company_settings(
        database_session=database_session, organization_id=employee.organization_id
    )

    ride_offer = RideOfferRecord(
        organization_id=employee.organization_id,
        driver_employee_id=employee.id,
        vehicle_id=vehicle.id,
        source_latitude=request.source.latitude,
        source_longitude=request.source.longitude,
        source_label=request.source.label,
        destination_latitude=request.destination.latitude,
        destination_longitude=request.destination.longitude,
        destination_label=request.destination.label,
        travel_date=request.travel_date,
        departure_window_start_time=request.departure_window_start_time,
        departure_window_end_time=request.departure_window_end_time,
        seats_total=seats_total,
        seats_available=seats_total,
        is_recurring=request.is_recurring,
        recurrence_days=_encode_recurrence_days(request.recurrence_days),
        recurrence_time=request.recurrence_time,
    )
    ride_offer = insert_ride_offer(database_session, ride_offer)

    matched_requests = find_requests_matching_offer(
        database_session=database_session,
        ride_offer=ride_offer,
        pickup_match_radius_kilometers=settings.pickup_match_radius_kilometers,
        drop_match_radius_kilometers=settings.drop_match_radius_kilometers,
    )
    matching_request_responses = [
        build_matching_request_response(
            database_session=database_session,
            organization_id=employee.organization_id,
            matched_request=matched_request,
        )
        for matched_request in matched_requests
    ]
    return CreateRideOfferResponse(
        ride_offer=RideOfferResponse.model_validate(ride_offer),
        matching_requests=matching_request_responses,
    )


@ride_discovery_router.get(
    "/offers/mine",
    response_model=list[RideOfferResponse],
    summary="List my ride offers (Menu > Rides > Ride Offers)",
)
def list_my_ride_offers(
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return all offers published by the current driver."""
    ride_offers = list_ride_offers_for_driver(
        database_session=database_session,
        organization_id=employee.organization_id,
        driver_employee_id=employee.id,
    )
    return [RideOfferResponse.model_validate(record) for record in ride_offers]
