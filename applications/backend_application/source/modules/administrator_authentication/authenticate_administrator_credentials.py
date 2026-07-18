"""Authentication workflow: validates credentials and produces tokens."""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from source.modules.administrator_authentication.user_account_record_model import UserAccountRecord
from source.modules.administrator_authentication.authentication_contracts import (
    AdministratorLoginRequest,
    AuthenticationTokensResponse,
    RefreshTokenRequest,
    ChangeAdministratorPasswordRequest,
    ChangeAdministratorPasswordResponse,
)
from source.modules.administrator_authentication.password_security import (
    hash_plain_text_password,
    verify_submitted_password_against_hash,
)
from source.modules.administrator_authentication.access_token_generation import (
    generate_access_token,
    generate_refresh_token,
    decode_refresh_token,
)
from source.application_startup.application_configuration import ApplicationConfiguration


def authenticate_administrator_credentials(
    login_request: AdministratorLoginRequest,
    database_session: Session,
    configuration: ApplicationConfiguration,
) -> AuthenticationTokensResponse:
    """Authenticate an administrator by email and password.

    Returns JWT tokens on success. Raises HTTP 401 with a generic
    message on failure (prevents account enumeration).
    """
    user_account = (
        database_session.query(UserAccountRecord)
        .filter(UserAccountRecord.email == login_request.email)
        .first()
    )

    if user_account is None or not verify_submitted_password_against_hash(
        login_request.password, user_account.password_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user_account.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    access_token = generate_access_token(
        user_account_id=user_account.id,
        email=user_account.email,
        role=user_account.role,
        organization_id=user_account.organization_id,
        jwt_secret=configuration.jwt_secret,
        jwt_algorithm=configuration.jwt_algorithm,
        expiration_minutes=configuration.jwt_access_token_expiration_minutes,
    )

    refresh_token = generate_refresh_token(
        user_account_id=user_account.id,
        jwt_secret=configuration.jwt_secret,
        jwt_algorithm=configuration.jwt_algorithm,
        expiration_days=configuration.jwt_refresh_token_expiration_days,
    )

    return AuthenticationTokensResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user_account_id=user_account.id,
        email=user_account.email,
        full_name=user_account.full_name,
        role=user_account.role,
        organization_id=user_account.organization_id,
        must_change_password=user_account.must_change_password,
    )


def refresh_administrator_access_token(
    refresh_request: RefreshTokenRequest,
    database_session: Session,
    configuration: ApplicationConfiguration,
) -> AuthenticationTokensResponse:
    """Validate a refresh token and issue new access + refresh tokens."""
    import jwt as pyjwt

    try:
        payload = decode_refresh_token(
            refresh_request.refresh_token,
            configuration.jwt_secret,
            configuration.jwt_algorithm,
        )
    except (pyjwt.ExpiredSignatureError, pyjwt.InvalidTokenError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user_account = (
        database_session.query(UserAccountRecord)
        .filter(UserAccountRecord.id == payload["sub"])
        .first()
    )

    if user_account is None or not user_account.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated",
        )

    access_token = generate_access_token(
        user_account_id=user_account.id,
        email=user_account.email,
        role=user_account.role,
        organization_id=user_account.organization_id,
        jwt_secret=configuration.jwt_secret,
        jwt_algorithm=configuration.jwt_algorithm,
        expiration_minutes=configuration.jwt_access_token_expiration_minutes,
    )

    new_refresh_token = generate_refresh_token(
        user_account_id=user_account.id,
        jwt_secret=configuration.jwt_secret,
        jwt_algorithm=configuration.jwt_algorithm,
        expiration_days=configuration.jwt_refresh_token_expiration_days,
    )

    return AuthenticationTokensResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user_account_id=user_account.id,
        email=user_account.email,
        full_name=user_account.full_name,
        role=user_account.role,
        organization_id=user_account.organization_id,
        must_change_password=user_account.must_change_password,
    )


def change_administrator_password(
    change_password_request: ChangeAdministratorPasswordRequest,
    user_account_id: str,
    database_session: Session,
) -> ChangeAdministratorPasswordResponse:
    """Replace an administrator password and clear the first-login requirement."""
    user_account = (
        database_session.query(UserAccountRecord)
        .filter(UserAccountRecord.id == user_account_id)
        .first()
    )

    if user_account is None or not user_account.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or deactivated",
        )

    is_current_password_valid = verify_submitted_password_against_hash(
        change_password_request.current_password,
        user_account.password_hash,
    )
    if not is_current_password_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    user_account.password_hash = hash_plain_text_password(
        change_password_request.new_password
    )
    user_account.must_change_password = False
    database_session.commit()

    return ChangeAdministratorPasswordResponse(
        message="Password changed successfully",
        must_change_password=False,
    )
