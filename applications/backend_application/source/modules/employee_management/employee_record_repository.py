"""Repository for employee record database operations."""

from sqlalchemy.orm import Session
from sqlalchemy import or_

from source.modules.employee_management.employee_record_model import EmployeeRecord


def create_employee_record(
    database_session: Session,
    employee_data: dict,
) -> EmployeeRecord:
    """Insert a new employee record into the database."""
    employee = EmployeeRecord(**employee_data)
    database_session.add(employee)
    database_session.commit()
    database_session.refresh(employee)
    return employee


def retrieve_employee_record_by_id(
    database_session: Session,
    employee_id: str,
    organization_id: str,
) -> EmployeeRecord | None:
    """Retrieve a single employee by ID, scoped to the organization."""
    return (
        database_session.query(EmployeeRecord)
        .filter(
            EmployeeRecord.id == employee_id,
            EmployeeRecord.organization_id == organization_id,
        )
        .first()
    )


def retrieve_paginated_employee_records(
    database_session: Session,
    organization_id: str,
    page: int,
    page_size: int,
    search_query: str = "",
    department_filter: str | None = None,
    status_filter: str | None = None,
) -> tuple[list[EmployeeRecord], int]:
    """Retrieve a paginated list of employees with optional filters.

    Returns a tuple of (employee_records, total_count).
    """
    query = database_session.query(EmployeeRecord).filter(
        EmployeeRecord.organization_id == organization_id
    )

    if search_query:
        search_pattern = f"%{search_query}%"
        query = query.filter(
            or_(
                EmployeeRecord.full_name.ilike(search_pattern),
                EmployeeRecord.email.ilike(search_pattern),
                EmployeeRecord.employee_code.ilike(search_pattern),
            )
        )

    if department_filter:
        query = query.filter(EmployeeRecord.department == department_filter)

    if status_filter:
        query = query.filter(EmployeeRecord.status == status_filter)

    total_count = query.count()
    offset = (page - 1) * page_size
    employee_records = (
        query.order_by(EmployeeRecord.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return employee_records, total_count


def update_employee_record(
    database_session: Session,
    employee: EmployeeRecord,
    update_data: dict,
) -> EmployeeRecord:
    """Update an existing employee record with the provided fields."""
    for field_name, field_value in update_data.items():
        if field_value is not None:
            setattr(employee, field_name, field_value)
    database_session.commit()
    database_session.refresh(employee)
    return employee


def delete_employee_record(
    database_session: Session,
    employee: EmployeeRecord,
) -> None:
    """Remove an employee record from the database."""
    database_session.delete(employee)
    database_session.commit()


def count_employees_by_organization(
    database_session: Session,
    organization_id: str,
) -> int:
    """Count total employees for an organization."""
    return (
        database_session.query(EmployeeRecord)
        .filter(EmployeeRecord.organization_id == organization_id)
        .count()
    )


def count_active_drivers_by_organization(
    database_session: Session,
    organization_id: str,
) -> int:
    """Count active drivers for an organization."""
    return (
        database_session.query(EmployeeRecord)
        .filter(
            EmployeeRecord.organization_id == organization_id,
            EmployeeRecord.is_driver == True,
            EmployeeRecord.status == "ACTIVE",
        )
        .count()
    )
