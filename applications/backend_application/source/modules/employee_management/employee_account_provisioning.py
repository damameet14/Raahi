"""Workflow that provisions an employee together with a login account.

An administrator creates an employee record and, in the same transaction,
the employee receives an EMPLOYEE login account with a temporary password
that must be changed on first login. This is what lets an admin-created
employee actually sign in to the employee application.
"""

from sqlalchemy.orm import Session

from source.modules.administrator_authentication.public_interface import (
    create_employee_login_account,
    reset_login_account_to_temporary_password,
    does_user_account_exist_for_email,
)
from source.modules.employee_management.employee_record_model import EmployeeRecord


class EmployeeEmailAlreadyRegisteredError(Exception):
    """Raised when a login account already exists for the employee email."""


class EmployeeLoginAccountMissingError(Exception):
    """Raised when an employee has no linked login account to reset."""


def provision_employee_with_login_account(
    *,
    database_session: Session,
    employee_data: dict,
) -> tuple[EmployeeRecord, str]:
    """Create an employee and its login account in a single transaction.

    Returns the persisted employee together with the plain-text temporary
    password to display to the administrator exactly once.

    Raises EmployeeEmailAlreadyRegisteredError if the email already has a
    login account, since account emails must be globally unique.
    """
    employee_email = employee_data["email"]
    organization_id = employee_data["organization_id"]

    if does_user_account_exist_for_email(
        email_address=employee_email,
        database_session=database_session,
    ):
        raise EmployeeEmailAlreadyRegisteredError(employee_email)

    login_account, temporary_password = create_employee_login_account(
        organization_id=organization_id,
        employee_email=employee_email,
        employee_full_name=employee_data["full_name"],
        database_session=database_session,
    )

    employee = EmployeeRecord(
        user_account_id=login_account.id,
        **employee_data,
    )
    database_session.add(employee)
    database_session.commit()
    database_session.refresh(employee)
    return employee, temporary_password


def reset_employee_login_password(
    *,
    database_session: Session,
    employee: EmployeeRecord,
) -> str:
    """Reset a linked login account back to a fresh temporary password.

    Returns the plain-text temporary password for one-time display.
    Raises EmployeeLoginAccountMissingError if the employee was created
    before login provisioning existed and has no linked account.
    """
    if employee.user_account_id is None:
        raise EmployeeLoginAccountMissingError(employee.id)

    temporary_password = reset_login_account_to_temporary_password(
        user_account_id=employee.user_account_id,
        database_session=database_session,
    )
    database_session.commit()
    return temporary_password
