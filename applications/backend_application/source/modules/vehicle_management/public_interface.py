"""Public operations for the vehicle management module.

Exposes the vehicle operations that other modules are allowed to call.
Employee self-service uses these to let an employee register and list
their own vehicles without reaching into vehicle-management internals.
"""

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from source.modules.vehicle_management.vehicle_record_model import VehicleRecord


class DuplicateVehicleNumberError(Exception):
    """Raised when a vehicle number already exists within the organization."""


def register_vehicle_for_owner(
    *,
    database_session: Session,
    organization_id: str,
    owner_employee_id: str,
    vehicle_number: str,
    make: str,
    model: str,
    capacity: int,
    fuel_type: str = "PETROL",
    year: int | None = None,
    color: str | None = None,
) -> VehicleRecord:
    """Register a vehicle owned by a specific employee.

    Raises DuplicateVehicleNumberError if the vehicle number is already
    registered within the same organization.
    """
    vehicle = VehicleRecord(
        organization_id=organization_id,
        owner_employee_id=owner_employee_id,
        vehicle_number=vehicle_number,
        make=make,
        model=model,
        capacity=capacity,
        fuel_type=fuel_type,
        year=year,
        color=color,
    )
    database_session.add(vehicle)
    try:
        database_session.commit()
    except IntegrityError as integrity_error:
        database_session.rollback()
        raise DuplicateVehicleNumberError(vehicle_number) from integrity_error
    database_session.refresh(vehicle)
    return vehicle


def retrieve_vehicles_for_owner(
    *,
    database_session: Session,
    organization_id: str,
    owner_employee_id: str,
) -> list[VehicleRecord]:
    """Return all active vehicles owned by an employee within the organization."""
    return (
        database_session.query(VehicleRecord)
        .filter(
            VehicleRecord.organization_id == organization_id,
            VehicleRecord.owner_employee_id == owner_employee_id,
            VehicleRecord.status == "ACTIVE",
        )
        .order_by(VehicleRecord.created_at.desc())
        .all()
    )


def retrieve_vehicle_by_id(
    *,
    database_session: Session,
    organization_id: str,
    vehicle_id: str,
) -> VehicleRecord | None:
    """Return a vehicle by identifier scoped to the organization."""
    return (
        database_session.query(VehicleRecord)
        .filter(
            VehicleRecord.id == vehicle_id,
            VehicleRecord.organization_id == organization_id,
        )
        .first()
    )


def retrieve_vehicle_for_owner_by_id(
    *,
    database_session: Session,
    organization_id: str,
    owner_employee_id: str,
    vehicle_id: str,
) -> VehicleRecord | None:
    """Return a single vehicle if it exists and belongs to the employee."""
    return (
        database_session.query(VehicleRecord)
        .filter(
            VehicleRecord.id == vehicle_id,
            VehicleRecord.organization_id == organization_id,
            VehicleRecord.owner_employee_id == owner_employee_id,
        )
        .first()
    )
