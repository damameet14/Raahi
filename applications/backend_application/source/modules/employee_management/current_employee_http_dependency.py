"""FastAPI dependency resolving the EmployeeRecord behind an employee login.

Shared by all employee-facing modules (self-service and ride coordination)
so the authenticated-account-to-employee resolution lives in one place,
owned by the module that owns EmployeeRecord.
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from source.application_startup.database_connection import get_database_session
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
    require_roles,
)
from source.shared_infrastructure.user_account_role import UserAccountRole
from source.modules.employee_management.employee_record_model import EmployeeRecord
from source.modules.employee_management.public_interface import (
    retrieve_employee_for_user_account,
)


def resolve_current_employee(
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.EMPLOYEE])
    ),
    database_session: Session = Depends(get_database_session),
) -> EmployeeRecord:
    """Return the EmployeeRecord for the authenticated employee login."""
    employee = retrieve_employee_for_user_account(
        database_session=database_session,
        user_account_id=current_user.user_account_id,
        organization_id=current_user.organization_id,
    )
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No employee profile is linked to this account",
        )
    return employee
