"""HTTP routes for administrator profile management."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from source.application_startup.database_connection import get_database_session
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
    extract_authenticated_user,
)
from source.modules.administrator_authentication.user_account_record_model import UserAccountRecord
from source.modules.administrator_authentication.password_security import (
    hash_plain_text_password,
    verify_submitted_password_against_hash,
)


class AdministratorProfileResponse(BaseModel):
    """Public representation of an administrator's profile."""

    id: str
    email: str
    full_name: str
    role: str
    organization_id: str
    is_active: bool


class UpdateAdministratorProfileRequest(BaseModel):
    """Request to update the administrator's profile."""

    full_name: str | None = Field(default=None, max_length=255)
    email: str | None = Field(default=None, max_length=255)


class ChangePasswordRequest(BaseModel):
    """Request to change the administrator's password."""

    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6)


administrator_profile_router = APIRouter(
    prefix="/api/v1/profile",
    tags=["Administrator Profile"],
)


@administrator_profile_router.get(
    "",
    response_model=AdministratorProfileResponse,
    summary="Get administrator profile",
)
def get_administrator_profile(
    current_user: AuthenticatedUserContext = Depends(extract_authenticated_user),
    database_session: Session = Depends(get_database_session),
):
    """Retrieve the currently authenticated administrator's profile."""
    user_account = (
        database_session.query(UserAccountRecord)
        .filter(UserAccountRecord.id == current_user.user_account_id)
        .first()
    )
    if user_account is None:
        raise HTTPException(status_code=404, detail="User account not found")
    return AdministratorProfileResponse(
        id=user_account.id,
        email=user_account.email,
        full_name=user_account.full_name,
        role=user_account.role,
        organization_id=user_account.organization_id,
        is_active=user_account.is_active,
    )


@administrator_profile_router.put(
    "",
    response_model=AdministratorProfileResponse,
    summary="Update administrator profile",
)
def update_administrator_profile(
    request: UpdateAdministratorProfileRequest,
    current_user: AuthenticatedUserContext = Depends(extract_authenticated_user),
    database_session: Session = Depends(get_database_session),
):
    """Update the currently authenticated administrator's profile."""
    user_account = (
        database_session.query(UserAccountRecord)
        .filter(UserAccountRecord.id == current_user.user_account_id)
        .first()
    )
    if user_account is None:
        raise HTTPException(status_code=404, detail="User account not found")

    update_data = request.model_dump(exclude_unset=True)
    for field_name, field_value in update_data.items():
        if field_value is not None:
            setattr(user_account, field_name, field_value)
    database_session.commit()
    database_session.refresh(user_account)

    return AdministratorProfileResponse(
        id=user_account.id,
        email=user_account.email,
        full_name=user_account.full_name,
        role=user_account.role,
        organization_id=user_account.organization_id,
        is_active=user_account.is_active,
    )


@administrator_profile_router.post(
    "/change-password",
    summary="Change administrator password",
)
def change_administrator_password(
    request: ChangePasswordRequest,
    current_user: AuthenticatedUserContext = Depends(extract_authenticated_user),
    database_session: Session = Depends(get_database_session),
):
    """Change the current administrator's password after verifying the current one."""
    user_account = (
        database_session.query(UserAccountRecord)
        .filter(UserAccountRecord.id == current_user.user_account_id)
        .first()
    )
    if user_account is None:
        raise HTTPException(status_code=404, detail="User account not found")

    if not verify_submitted_password_against_hash(
        request.current_password, user_account.password_hash
    ):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user_account.password_hash = hash_plain_text_password(request.new_password)
    database_session.commit()
    return {"message": "Password changed successfully"}
