"""HTTP routes for employee management CRUD operations."""

import math
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from source.application_startup.database_connection import get_database_session
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
    extract_authenticated_user,
    require_roles,
)
from source.shared_infrastructure.user_account_role import UserAccountRole
from source.shared_infrastructure.pagination_contracts import PaginatedResponse
from source.modules.employee_management.employee_management_contracts import (
    CreateEmployeeRequest,
    CreateEmployeeResponse,
    UpdateEmployeeRequest,
    EmployeeResponse,
    ResetEmployeePasswordResponse,
)
from source.modules.employee_management.employee_record_repository import (
    retrieve_employee_record_by_id,
    retrieve_paginated_employee_records,
    update_employee_record,
    delete_employee_record,
)
from source.modules.employee_management.employee_account_provisioning import (
    provision_employee_with_login_account,
    reset_employee_login_password,
    EmployeeEmailAlreadyRegisteredError,
    EmployeeLoginAccountMissingError,
)

employee_management_router = APIRouter(
    prefix="/api/v1/employees",
    tags=["Employee Management"],
)


@employee_management_router.get(
    "",
    response_model=PaginatedResponse[EmployeeResponse],
    summary="List employees with pagination and filters",
)
def list_employees(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search_query: str = Query(default=""),
    department: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Retrieve a paginated, filterable list of employees."""
    employee_records, total_count = retrieve_paginated_employee_records(
        database_session=database_session,
        organization_id=current_user.organization_id,
        page=page,
        page_size=page_size,
        search_query=search_query,
        department_filter=department,
        status_filter=status_filter,
    )
    return PaginatedResponse(
        items=[EmployeeResponse.model_validate(record) for record in employee_records],
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total_count / page_size) if total_count > 0 else 0,
    )


@employee_management_router.post(
    "",
    response_model=CreateEmployeeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new employee and provision a login account",
)
def create_employee(
    request: CreateEmployeeRequest,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Create an employee and its EMPLOYEE login account.

    Returns the created employee together with a one-time temporary
    password the administrator hands to the employee for first login.
    """
    employee_data = request.model_dump()
    employee_data["organization_id"] = current_user.organization_id
    try:
        employee, temporary_password = provision_employee_with_login_account(
            database_session=database_session,
            employee_data=employee_data,
        )
    except EmployeeEmailAlreadyRegisteredError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A login account already exists for this email address",
        )
    return CreateEmployeeResponse(
        **EmployeeResponse.model_validate(employee).model_dump(),
        temporary_password=temporary_password,
    )


@employee_management_router.post(
    "/{employee_id}/reset-password",
    response_model=ResetEmployeePasswordResponse,
    summary="Regenerate an employee's temporary login password",
)
def reset_employee_password(
    employee_id: str,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Reset an employee to a new temporary password and force a change."""
    employee = retrieve_employee_record_by_id(
        database_session, employee_id, current_user.organization_id
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    try:
        temporary_password = reset_employee_login_password(
            database_session=database_session,
            employee=employee,
        )
    except EmployeeLoginAccountMissingError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee has no login account to reset",
        )
    return ResetEmployeePasswordResponse(
        employee_id=employee.id,
        temporary_password=temporary_password,
    )


@employee_management_router.get(
    "/{employee_id}",
    response_model=EmployeeResponse,
    summary="Get employee by ID",
)
def get_employee_by_id(
    employee_id: str,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Retrieve a single employee by their identifier."""
    employee = retrieve_employee_record_by_id(
        database_session, employee_id, current_user.organization_id
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    return EmployeeResponse.model_validate(employee)


@employee_management_router.put(
    "/{employee_id}",
    response_model=EmployeeResponse,
    summary="Update an employee",
)
def update_employee(
    employee_id: str,
    request: UpdateEmployeeRequest,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Update an existing employee's details."""
    employee = retrieve_employee_record_by_id(
        database_session, employee_id, current_user.organization_id
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )
    update_data = request.model_dump(exclude_unset=True)
    updated_employee = update_employee_record(database_session, employee, update_data)
    return EmployeeResponse.model_validate(updated_employee)


@employee_management_router.patch(
    "/{employee_id}/activate",
    response_model=EmployeeResponse,
    summary="Activate an employee",
)
def activate_employee(
    employee_id: str,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Set an employee's status to ACTIVE."""
    employee = retrieve_employee_record_by_id(
        database_session, employee_id, current_user.organization_id
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    updated = update_employee_record(database_session, employee, {"status": "ACTIVE"})
    return EmployeeResponse.model_validate(updated)


@employee_management_router.patch(
    "/{employee_id}/deactivate",
    response_model=EmployeeResponse,
    summary="Deactivate an employee",
)
def deactivate_employee(
    employee_id: str,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Set an employee's status to INACTIVE."""
    employee = retrieve_employee_record_by_id(
        database_session, employee_id, current_user.organization_id
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    updated = update_employee_record(database_session, employee, {"status": "INACTIVE"})
    return EmployeeResponse.model_validate(updated)


@employee_management_router.delete(
    "/{employee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an employee",
)
def remove_employee(
    employee_id: str,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Permanently remove an employee record."""
    employee = retrieve_employee_record_by_id(
        database_session, employee_id, current_user.organization_id
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    delete_employee_record(database_session, employee)
