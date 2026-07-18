"""Public operations for the employee management module.

Other modules resolve the EmployeeRecord behind an authenticated employee
login through this interface rather than querying the table directly.
"""

from sqlalchemy.orm import Session

from source.modules.employee_management.employee_record_model import EmployeeRecord


def retrieve_employee_for_user_account(
    *,
    database_session: Session,
    user_account_id: str,
    organization_id: str,
) -> EmployeeRecord | None:
    """Return the employee linked to a login account within the organization."""
    return (
        database_session.query(EmployeeRecord)
        .filter(
            EmployeeRecord.user_account_id == user_account_id,
            EmployeeRecord.organization_id == organization_id,
        )
        .first()
    )


def retrieve_employee_by_id_within_organization(
    *,
    database_session: Session,
    employee_id: str,
    organization_id: str,
) -> EmployeeRecord | None:
    """Return an employee by identifier scoped to the organization."""
    return (
        database_session.query(EmployeeRecord)
        .filter(
            EmployeeRecord.id == employee_id,
            EmployeeRecord.organization_id == organization_id,
        )
        .first()
    )
