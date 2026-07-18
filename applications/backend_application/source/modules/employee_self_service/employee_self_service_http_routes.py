"""HTTP routes for employee-facing self-service operations."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from source.application_startup.database_connection import get_database_session
from source.modules.employee_management.employee_record_model import EmployeeRecord
from source.modules.employee_management.current_employee_http_dependency import (
    resolve_current_employee,
)
from source.modules.vehicle_management.public_interface import (
    register_vehicle_for_owner,
    retrieve_vehicles_for_owner,
    DuplicateVehicleNumberError,
)
from source.modules.vehicle_management.vehicle_record_model import VehicleRecord
from source.modules.employee_self_service.employee_self_service_contracts import (
    SubmitOnboardingRequest,
    UpdateEmployeeAddressesRequest,
    RegisterVehicleRequest,
    VehicleSummary,
    EmployeeProfileResponse,
)

employee_self_service_router = APIRouter(
    prefix="/api/v1/employee",
    tags=["Employee Self-Service"],
)


def _summarize_vehicle(vehicle: VehicleRecord) -> VehicleSummary:
    """Adapt a persisted vehicle to the compact employee-app summary."""
    return VehicleSummary(
        id=vehicle.id,
        make=vehicle.make,
        model=vehicle.model,
        vehicle_number=vehicle.vehicle_number,
        maximum_passengers=vehicle.capacity,
    )


def _build_profile_response(
    *,
    employee: EmployeeRecord,
    database_session: Session,
) -> EmployeeProfileResponse:
    """Assemble the employee profile including owned vehicles."""
    owned_vehicles = retrieve_vehicles_for_owner(
        database_session=database_session,
        organization_id=employee.organization_id,
        owner_employee_id=employee.id,
    )
    vehicle_summaries = [_summarize_vehicle(vehicle) for vehicle in owned_vehicles]
    return EmployeeProfileResponse(
        id=employee.id,
        organization_id=employee.organization_id,
        employee_code=employee.employee_code,
        full_name=employee.full_name,
        email=employee.email,
        phone=employee.phone,
        department=employee.department,
        designation=employee.designation,
        is_driver=employee.is_driver,
        onboarding_completed=employee.onboarding_completed,
        home_latitude=employee.home_latitude,
        home_longitude=employee.home_longitude,
        home_address_label=employee.home_address_label,
        office_latitude=employee.office_latitude,
        office_longitude=employee.office_longitude,
        office_address_label=employee.office_address_label,
        vehicles=vehicle_summaries,
        can_offer_ride=len(vehicle_summaries) > 0,
    )


@employee_self_service_router.get(
    "/me",
    response_model=EmployeeProfileResponse,
    summary="Get the authenticated employee's own profile",
)
def get_my_profile(
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return the current employee's profile, vehicles, and capabilities."""
    return _build_profile_response(
        employee=employee, database_session=database_session
    )


@employee_self_service_router.put(
    "/me/addresses",
    response_model=EmployeeProfileResponse,
    summary="Update the authenticated employee's home and office addresses",
)
def update_my_addresses(
    request: UpdateEmployeeAddressesRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Update the current employee's saved home and office locations."""
    employee.home_latitude = request.home_latitude
    employee.home_longitude = request.home_longitude
    employee.home_address_label = request.home_address_label
    employee.office_latitude = request.office_latitude
    employee.office_longitude = request.office_longitude
    employee.office_address_label = request.office_address_label
    database_session.commit()
    database_session.refresh(employee)
    return _build_profile_response(
        employee=employee, database_session=database_session
    )


@employee_self_service_router.post(
    "/onboarding",
    response_model=EmployeeProfileResponse,
    summary="Complete first-login onboarding",
)
def complete_onboarding(
    request: SubmitOnboardingRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Record home/office locations, optional vehicle, and mark onboarding done."""
    if request.has_vehicle and request.vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Vehicle details are required when has_vehicle is true",
        )

    employee.home_latitude = request.home_latitude
    employee.home_longitude = request.home_longitude
    employee.home_address_label = request.home_address_label
    employee.office_latitude = request.office_latitude
    employee.office_longitude = request.office_longitude
    employee.office_address_label = request.office_address_label
    employee.is_driver = request.has_vehicle
    employee.onboarding_completed = True
    database_session.commit()

    if request.has_vehicle and request.vehicle is not None:
        try:
            register_vehicle_for_owner(
                database_session=database_session,
                organization_id=employee.organization_id,
                owner_employee_id=employee.id,
                vehicle_number=request.vehicle.vehicle_number,
                make=request.vehicle.make_and_model,
                model="",
                capacity=request.vehicle.maximum_passengers,
            )
        except DuplicateVehicleNumberError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A vehicle with this number is already registered",
            )

    database_session.refresh(employee)
    return _build_profile_response(
        employee=employee, database_session=database_session
    )


@employee_self_service_router.get(
    "/vehicles",
    response_model=list[VehicleSummary],
    summary="List the authenticated employee's vehicles",
)
def list_my_vehicles(
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Return all active vehicles owned by the current employee."""
    owned_vehicles = retrieve_vehicles_for_owner(
        database_session=database_session,
        organization_id=employee.organization_id,
        owner_employee_id=employee.id,
    )
    return [_summarize_vehicle(vehicle) for vehicle in owned_vehicles]


@employee_self_service_router.post(
    "/vehicles",
    response_model=VehicleSummary,
    status_code=status.HTTP_201_CREATED,
    summary="Register a vehicle owned by the authenticated employee",
)
def register_my_vehicle(
    request: RegisterVehicleRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
):
    """Register a new vehicle for the current employee and mark them a driver."""
    try:
        vehicle = register_vehicle_for_owner(
            database_session=database_session,
            organization_id=employee.organization_id,
            owner_employee_id=employee.id,
            vehicle_number=request.vehicle_number,
            make=request.make,
            model=request.model,
            capacity=request.maximum_passengers,
            fuel_type=request.fuel_type,
            color=request.color,
        )
    except DuplicateVehicleNumberError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A vehicle with this number is already registered",
        )

    if not employee.is_driver:
        employee.is_driver = True
        database_session.commit()

    return _summarize_vehicle(vehicle)
