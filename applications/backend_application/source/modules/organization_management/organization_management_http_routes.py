"""HTTP routes for organization management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime

from source.application_startup.database_connection import get_database_session
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
    require_roles,
)
from source.shared_infrastructure.user_account_role import UserAccountRole
from source.modules.organization_management.organization_record_model import OrganizationRecord


class OrganizationResponse(BaseModel):
    """Public representation of an organization."""

    id: str
    name: str
    slug: str
    logo_url: str | None
    address: str | None
    industry: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpdateOrganizationRequest(BaseModel):
    """Request to update organization details."""

    name: str | None = Field(default=None, max_length=255)
    address: str | None = Field(default=None, max_length=500)
    industry: str | None = Field(default=None, max_length=100)
    logo_url: str | None = Field(default=None, max_length=500)


organization_management_router = APIRouter(
    prefix="/api/v1/organizations",
    tags=["Organization Management"],
)


@organization_management_router.get(
    "/current",
    response_model=OrganizationResponse,
    summary="Get current organization details",
)
def get_current_organization(
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Retrieve the organization of the currently authenticated admin."""
    organization = (
        database_session.query(OrganizationRecord)
        .filter(OrganizationRecord.id == current_user.organization_id)
        .first()
    )
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return OrganizationResponse.model_validate(organization)


@organization_management_router.put(
    "/current",
    response_model=OrganizationResponse,
    summary="Update current organization",
)
def update_current_organization(
    request: UpdateOrganizationRequest,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Update the current organization's details."""
    organization = (
        database_session.query(OrganizationRecord)
        .filter(OrganizationRecord.id == current_user.organization_id)
        .first()
    )
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    update_data = request.model_dump(exclude_unset=True)
    for field_name, field_value in update_data.items():
        if field_value is not None:
            setattr(organization, field_name, field_value)
    database_session.commit()
    database_session.refresh(organization)
    return OrganizationResponse.model_validate(organization)
