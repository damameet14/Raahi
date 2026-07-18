"""HTTP routes for administrator authentication."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from source.application_startup.database_connection import get_database_session
from source.application_startup.application_configuration import (
    ApplicationConfiguration,
    create_application_configuration,
)
from source.modules.administrator_authentication.authentication_contracts import (
    AdministratorLoginRequest,
    AuthenticationTokensResponse,
    RefreshTokenRequest,
)
from source.modules.administrator_authentication.authenticate_administrator_credentials import (
    authenticate_administrator_credentials,
    refresh_administrator_access_token,
)
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
    extract_authenticated_user,
)

administrator_authentication_router = APIRouter(
    prefix="/api/v1/authentication",
    tags=["Authentication"],
)


@administrator_authentication_router.post(
    "/login",
    response_model=AuthenticationTokensResponse,
    summary="Authenticate administrator with email and password",
)
def login_administrator(
    login_request: AdministratorLoginRequest,
    database_session: Session = Depends(get_database_session),
    configuration: ApplicationConfiguration = Depends(create_application_configuration),
):
    """Authenticate a company administrator and return JWT tokens."""
    return authenticate_administrator_credentials(
        login_request=login_request,
        database_session=database_session,
        configuration=configuration,
    )


@administrator_authentication_router.post(
    "/refresh",
    response_model=AuthenticationTokensResponse,
    summary="Refresh an expired access token",
)
def refresh_access_token(
    refresh_request: RefreshTokenRequest,
    database_session: Session = Depends(get_database_session),
    configuration: ApplicationConfiguration = Depends(create_application_configuration),
):
    """Use a valid refresh token to obtain new access and refresh tokens."""
    return refresh_administrator_access_token(
        refresh_request=refresh_request,
        database_session=database_session,
        configuration=configuration,
    )


@administrator_authentication_router.get(
    "/me",
    summary="Get current authenticated user profile",
)
def get_current_authenticated_user(
    current_user: AuthenticatedUserContext = Depends(extract_authenticated_user),
):
    """Return the currently authenticated user's basic information."""
    return {
        "user_account_id": current_user.user_account_id,
        "email": current_user.email,
        "role": current_user.role.value,
        "organization_id": current_user.organization_id,
    }
