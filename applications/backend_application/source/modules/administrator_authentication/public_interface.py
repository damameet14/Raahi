"""Public operations for administrator authentication module."""

from sqlalchemy.orm import Session

from source.modules.administrator_authentication.password_security import (
    hash_plain_text_password,
    generate_temporary_password,
)
from source.modules.administrator_authentication.user_account_record_model import (
    UserAccountRecord,
)
from source.shared_infrastructure.user_account_role import UserAccountRole


def create_company_administrator_account(
    *,
    organization_id: str,
    administrator_email: str,
    administrator_full_name: str,
    temporary_password: str,
    database_session: Session,
) -> UserAccountRecord:
    """Create the first company administrator account for an organization."""
    administrator_account = UserAccountRecord(
        organization_id=organization_id,
        email=administrator_email,
        password_hash=hash_plain_text_password(temporary_password),
        full_name=administrator_full_name,
        role=UserAccountRole.COMPANY_ADMIN.value,
        must_change_password=True,
        is_active=True,
    )
    database_session.add(administrator_account)
    return administrator_account


def create_employee_login_account(
    *,
    organization_id: str,
    employee_email: str,
    employee_full_name: str,
    database_session: Session,
) -> tuple[UserAccountRecord, str]:
    """Create an EMPLOYEE login account with a generated temporary password.

    The account is flagged to force a password change on first login.
    Returns the persisted account (added to the session, flushed so its
    id is available) together with the plain-text temporary password,
    which the caller must surface to the administrator exactly once and
    never store in plain text.
    """
    temporary_password = generate_temporary_password()
    employee_account = UserAccountRecord(
        organization_id=organization_id,
        email=employee_email,
        password_hash=hash_plain_text_password(temporary_password),
        full_name=employee_full_name,
        role=UserAccountRole.EMPLOYEE.value,
        must_change_password=True,
        is_active=True,
    )
    database_session.add(employee_account)
    database_session.flush()
    return employee_account, temporary_password


def reset_login_account_to_temporary_password(
    *,
    user_account_id: str,
    database_session: Session,
) -> str:
    """Reset an account to a new temporary password and force a change.

    Returns the plain-text temporary password for one-time display.
    Raises LookupError if no account exists for the identifier.
    """
    user_account = (
        database_session.query(UserAccountRecord)
        .filter(UserAccountRecord.id == user_account_id)
        .first()
    )
    if user_account is None:
        raise LookupError("User account not found")

    temporary_password = generate_temporary_password()
    user_account.password_hash = hash_plain_text_password(temporary_password)
    user_account.must_change_password = True
    database_session.flush()
    return temporary_password


def does_user_account_exist_for_email(
    *,
    email_address: str,
    database_session: Session,
) -> bool:
    """Return whether a user account already exists for the email address."""
    return (
        database_session.query(UserAccountRecord)
        .filter(UserAccountRecord.email == email_address)
        .first()
        is not None
    )
