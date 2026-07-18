"""HTTP routes for vehicle management CRUD operations."""

import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from source.application_startup.database_connection import get_database_session
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
    require_roles,
)
from source.shared_infrastructure.user_account_role import UserAccountRole
from source.shared_infrastructure.pagination_contracts import PaginatedResponse
from source.modules.vehicle_management.vehicle_management_contracts import (
    CreateVehicleRequest,
    UpdateVehicleRequest,
    VehicleResponse,
)
from source.modules.vehicle_management.vehicle_record_repository import (
    create_vehicle_record,
    retrieve_vehicle_record_by_id,
    retrieve_paginated_vehicle_records,
    update_vehicle_record,
    delete_vehicle_record,
)

vehicle_management_router = APIRouter(
    prefix="/api/v1/vehicles",
    tags=["Vehicle Management"],
)


@vehicle_management_router.get(
    "",
    response_model=PaginatedResponse[VehicleResponse],
    summary="List vehicles with pagination and filters",
)
def list_vehicles(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search_query: str = Query(default=""),
    status_filter: str | None = Query(default=None, alias="status"),
    fuel_type: str | None = Query(default=None),
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Retrieve a paginated, filterable list of vehicles."""
    vehicle_records, total_count = retrieve_paginated_vehicle_records(
        database_session=database_session,
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
        search_query=search_query,
        status_filter=status_filter,
        fuel_type_filter=fuel_type,
    )
    return PaginatedResponse(
        items=[VehicleResponse.model_validate(record) for record in vehicle_records],
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total_count / page_size) if total_count > 0 else 0,
    )


@vehicle_management_router.post(
    "",
    response_model=VehicleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new vehicle",
)
def create_vehicle(
    request: CreateVehicleRequest,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Register a new vehicle within the current organization."""
    vehicle_data = request.model_dump()
    vehicle_data["organization_id"] = current_user.organization_id
    vehicle = create_vehicle_record(database_session, vehicle_data)
    return VehicleResponse.model_validate(vehicle)


@vehicle_management_router.get(
    "/{vehicle_id}",
    response_model=VehicleResponse,
    summary="Get vehicle by ID",
)
def get_vehicle_by_id(
    vehicle_id: str,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Retrieve a single vehicle by its identifier."""
    vehicle = retrieve_vehicle_record_by_id(
        database_session, vehicle_id, current_user.organization_id
    )
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return VehicleResponse.model_validate(vehicle)


@vehicle_management_router.put(
    "/{vehicle_id}",
    response_model=VehicleResponse,
    summary="Update a vehicle",
)
def update_vehicle(
    vehicle_id: str,
    request: UpdateVehicleRequest,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Update an existing vehicle's details."""
    vehicle = retrieve_vehicle_record_by_id(
        database_session, vehicle_id, current_user.organization_id
    )
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    update_data = request.model_dump(exclude_unset=True)
    updated = update_vehicle_record(database_session, vehicle, update_data)
    return VehicleResponse.model_validate(updated)


@vehicle_management_router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a vehicle",
)
def remove_vehicle(
    vehicle_id: str,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Permanently remove a vehicle record."""
    vehicle = retrieve_vehicle_record_by_id(
        database_session, vehicle_id, current_user.organization_id
    )
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    delete_vehicle_record(database_session, vehicle)
