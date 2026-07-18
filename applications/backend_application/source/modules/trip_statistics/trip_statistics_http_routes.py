"""HTTP routes for trip statistics and reporting."""

import math
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel

from source.application_startup.database_connection import get_database_session
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
    require_roles,
)
from source.shared_infrastructure.user_account_role import UserAccountRole
from source.shared_infrastructure.pagination_contracts import PaginatedResponse
from source.modules.trip_statistics.trip_record_model import TripRecord


class TripResponse(BaseModel):
    """Public representation of a trip record."""

    id: str
    organization_id: str
    driver_employee_id: str
    vehicle_id: str
    start_location_name: str
    end_location_name: str
    distance_kilometers: float
    fuel_consumed_liters: float
    trip_cost: float
    passenger_count: int
    status: str
    started_at: datetime | None
    completed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TripStatisticsSummary(BaseModel):
    """Aggregated trip statistics for reports."""

    total_trips: int
    total_distance_kilometers: float
    total_fuel_consumed_liters: float
    total_trip_cost: float
    total_passengers_carried: int
    average_distance_per_trip: float
    average_passengers_per_trip: float


class MonthlyTripStatistic(BaseModel):
    """Trip statistics aggregated by month."""

    month: str
    trip_count: int
    total_distance: float
    total_fuel: float
    total_cost: float


trip_statistics_router = APIRouter(
    prefix="/api/v1/trips",
    tags=["Trip Statistics"],
)


@trip_statistics_router.get(
    "",
    response_model=PaginatedResponse[TripResponse],
    summary="List trips with pagination",
)
def list_trips(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Retrieve a paginated list of trips."""
    query = database_session.query(TripRecord).filter(
        TripRecord.organization_id == current_user.organization_id
    )
    if status_filter:
        query = query.filter(TripRecord.status == status_filter)

    total_count = query.count()
    offset = (page - 1) * page_size
    trips = (
        query.order_by(TripRecord.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return PaginatedResponse(
        items=[TripResponse.model_validate(trip) for trip in trips],
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total_count / page_size) if total_count > 0 else 0,
    )


@trip_statistics_router.get(
    "/summary",
    response_model=TripStatisticsSummary,
    summary="Get aggregated trip statistics",
)
def get_trip_statistics_summary(
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Return aggregated statistics across all trips for the organization."""
    result = (
        database_session.query(
            func.count(TripRecord.id).label("total_trips"),
            func.coalesce(func.sum(TripRecord.distance_kilometers), 0).label("total_distance"),
            func.coalesce(func.sum(TripRecord.fuel_consumed_liters), 0).label("total_fuel"),
            func.coalesce(func.sum(TripRecord.trip_cost), 0).label("total_cost"),
            func.coalesce(func.sum(TripRecord.passenger_count), 0).label("total_passengers"),
        )
        .filter(TripRecord.organization_id == current_user.organization_id)
        .first()
    )

    total_trips = result.total_trips or 0
    return TripStatisticsSummary(
        total_trips=total_trips,
        total_distance_kilometers=float(result.total_distance),
        total_fuel_consumed_liters=float(result.total_fuel),
        total_trip_cost=float(result.total_cost),
        total_passengers_carried=int(result.total_passengers),
        average_distance_per_trip=round(float(result.total_distance) / total_trips, 2) if total_trips > 0 else 0,
        average_passengers_per_trip=round(float(result.total_passengers) / total_trips, 2) if total_trips > 0 else 0,
    )


@trip_statistics_router.get(
    "/monthly",
    response_model=list[MonthlyTripStatistic],
    summary="Get monthly trip statistics",
)
def get_monthly_trip_statistics(
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Return trip statistics grouped by month for chart rendering."""
    results = (
        database_session.query(
            func.to_char(TripRecord.started_at, 'YYYY-MM').label("month"),
            func.count(TripRecord.id).label("trip_count"),
            func.coalesce(func.sum(TripRecord.distance_kilometers), 0).label("total_distance"),
            func.coalesce(func.sum(TripRecord.fuel_consumed_liters), 0).label("total_fuel"),
            func.coalesce(func.sum(TripRecord.trip_cost), 0).label("total_cost"),
        )
        .filter(
            TripRecord.organization_id == current_user.organization_id,
            TripRecord.started_at.isnot(None),
        )
        .group_by(func.to_char(TripRecord.started_at, 'YYYY-MM'))
        .order_by(func.to_char(TripRecord.started_at, 'YYYY-MM'))
        .all()
    )

    return [
        MonthlyTripStatistic(
            month=row.month,
            trip_count=row.trip_count,
            total_distance=float(row.total_distance),
            total_fuel=float(row.total_fuel),
            total_cost=float(row.total_cost),
        )
        for row in results
    ]
