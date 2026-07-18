"""Repository for vehicle record database operations."""

from sqlalchemy.orm import Session
from sqlalchemy import or_

from source.modules.vehicle_management.vehicle_record_model import VehicleRecord


def create_vehicle_record(
    database_session: Session,
    vehicle_data: dict,
) -> VehicleRecord:
    """Insert a new vehicle record."""
    vehicle = VehicleRecord(**vehicle_data)
    database_session.add(vehicle)
    database_session.commit()
    database_session.refresh(vehicle)
    return vehicle


def retrieve_vehicle_record_by_id(
    database_session: Session,
    vehicle_id: str,
    organization_id: str,
) -> VehicleRecord | None:
    """Retrieve a single vehicle by ID, scoped to the organization."""
    return (
        database_session.query(VehicleRecord)
        .filter(
            VehicleRecord.id == vehicle_id,
            VehicleRecord.organization_id == organization_id,
        )
        .first()
    )


def retrieve_paginated_vehicle_records(
    database_session: Session,
    organization_id: str,
    page: int,
    page_size: int,
    search_query: str = "",
    status_filter: str | None = None,
    fuel_type_filter: str | None = None,
) -> tuple[list[VehicleRecord], int]:
    """Retrieve a paginated list of vehicles with optional filters."""
    query = database_session.query(VehicleRecord).filter(
        VehicleRecord.organization_id == organization_id
    )

    if search_query:
        search_pattern = f"%{search_query}%"
        query = query.filter(
            or_(
                VehicleRecord.vehicle_number.ilike(search_pattern),
                VehicleRecord.make.ilike(search_pattern),
                VehicleRecord.model.ilike(search_pattern),
            )
        )

    if status_filter:
        query = query.filter(VehicleRecord.status == status_filter)

    if fuel_type_filter:
        query = query.filter(VehicleRecord.fuel_type == fuel_type_filter)

    total_count = query.count()
    offset = (page - 1) * page_size
    vehicle_records = (
        query.order_by(VehicleRecord.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return vehicle_records, total_count


def update_vehicle_record(
    database_session: Session,
    vehicle: VehicleRecord,
    update_data: dict,
) -> VehicleRecord:
    """Update an existing vehicle record."""
    for field_name, field_value in update_data.items():
        if field_value is not None:
            setattr(vehicle, field_name, field_value)
    database_session.commit()
    database_session.refresh(vehicle)
    return vehicle


def delete_vehicle_record(
    database_session: Session,
    vehicle: VehicleRecord,
) -> None:
    """Remove a vehicle record from the database."""
    database_session.delete(vehicle)
    database_session.commit()


def count_vehicles_by_organization(
    database_session: Session,
    organization_id: str,
) -> int:
    """Count total vehicles for an organization."""
    return (
        database_session.query(VehicleRecord)
        .filter(VehicleRecord.organization_id == organization_id)
        .count()
    )
