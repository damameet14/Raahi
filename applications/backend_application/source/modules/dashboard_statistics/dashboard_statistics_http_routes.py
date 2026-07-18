"""HTTP routes for dashboard statistics aggregation."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from source.application_startup.database_connection import get_database_session
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
    require_roles,
)
from source.shared_infrastructure.user_account_role import UserAccountRole
from source.modules.employee_management.employee_record_model import EmployeeRecord
from source.modules.vehicle_management.vehicle_record_model import VehicleRecord
from source.modules.trip_statistics.trip_record_model import TripRecord


class DashboardStatisticsResponse(BaseModel):
    """Aggregated dashboard card data for the admin overview."""

    total_employees: int
    registered_vehicles: int
    total_trips: int
    active_drivers: int
    ride_requests: int
    total_distance_kilometers: float
    fuel_saved_liters: float
    estimated_carbon_dioxide_saved_kilograms: float


dashboard_statistics_router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"],
)


@dashboard_statistics_router.get(
    "/statistics",
    response_model=DashboardStatisticsResponse,
    summary="Get dashboard overview statistics",
)
def get_dashboard_statistics(
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Return aggregated statistics for the dashboard overview cards."""
    organization_id = current_user.organization_id

    total_employees = (
        database_session.query(func.count(EmployeeRecord.id))
        .filter(EmployeeRecord.organization_id == organization_id)
        .scalar()
    ) or 0

    registered_vehicles = (
        database_session.query(func.count(VehicleRecord.id))
        .filter(VehicleRecord.organization_id == organization_id)
        .scalar()
    ) or 0

    total_trips = (
        database_session.query(func.count(TripRecord.id))
        .filter(TripRecord.organization_id == organization_id)
        .scalar()
    ) or 0

    active_drivers = (
        database_session.query(func.count(EmployeeRecord.id))
        .filter(
            EmployeeRecord.organization_id == organization_id,
            EmployeeRecord.is_driver == True,
            EmployeeRecord.status == "ACTIVE",
        )
        .scalar()
    ) or 0

    trip_aggregates = (
        database_session.query(
            func.coalesce(func.sum(TripRecord.distance_kilometers), 0).label("total_distance"),
            func.coalesce(func.sum(TripRecord.fuel_consumed_liters), 0).label("total_fuel"),
        )
        .filter(TripRecord.organization_id == organization_id)
        .first()
    )

    total_distance = float(trip_aggregates.total_distance) if trip_aggregates else 0.0
    total_fuel = float(trip_aggregates.total_fuel) if trip_aggregates else 0.0

    # Estimate: carpooling saves ~40% fuel vs individual driving
    fuel_saved = round(total_fuel * 0.4, 2)
    # CO2 factor: 2.31 kg CO2 per liter of petrol
    carbon_dioxide_saved = round(fuel_saved * 2.31, 2)

    return DashboardStatisticsResponse(
        total_employees=total_employees,
        registered_vehicles=registered_vehicles,
        total_trips=total_trips,
        active_drivers=active_drivers,
        ride_requests=total_trips,  # Placeholder: equals trips for demo
        total_distance_kilometers=total_distance,
        fuel_saved_liters=fuel_saved,
        estimated_carbon_dioxide_saved_kilograms=carbon_dioxide_saved,
    )
