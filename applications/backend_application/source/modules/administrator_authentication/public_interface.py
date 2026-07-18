"""Public operations for administrator authentication module."""

from sqlalchemy.orm import Session

from source.modules.administrator_authentication.password_security import (
    hash_plain_text_password,
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
