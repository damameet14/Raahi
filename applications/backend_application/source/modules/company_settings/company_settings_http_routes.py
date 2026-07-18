"""HTTP routes for company settings management."""

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
from source.modules.company_settings.company_settings_record_model import CompanySettingsRecord


class CompanySettingsResponse(BaseModel):
    """Public representation of company settings."""

    id: str
    organization_id: str
    fuel_cost_per_liter: float
    travel_cost_per_kilometer: float
    office_latitude: float
    office_longitude: float
    ride_radius_kilometers: float
    pickup_match_radius_kilometers: float
    drop_match_radius_kilometers: float
    default_currency: str
    company_logo_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpdateCompanySettingsRequest(BaseModel):
    """Request to update company settings."""

    fuel_cost_per_liter: float | None = Field(default=None, ge=0)
    travel_cost_per_kilometer: float | None = Field(default=None, ge=0)
    office_latitude: float | None = None
    office_longitude: float | None = None
    ride_radius_kilometers: float | None = Field(default=None, ge=1)
    pickup_match_radius_kilometers: float | None = Field(default=None, gt=0)
    drop_match_radius_kilometers: float | None = Field(default=None, gt=0)
    default_currency: str | None = Field(default=None, max_length=10)
    company_logo_url: str | None = Field(default=None, max_length=500)


company_settings_router = APIRouter(
    prefix="/api/v1/settings",
    tags=["Company Settings"],
)


@company_settings_router.get(
    "",
    response_model=CompanySettingsResponse,
    summary="Get company settings",
)
def get_company_settings(
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Retrieve the company settings for the current organization."""
    settings = (
        database_session.query(CompanySettingsRecord)
        .filter(CompanySettingsRecord.organization_id == current_user.organization_id)
        .first()
    )
    if settings is None:
        raise HTTPException(status_code=404, detail="Company settings not found")
    return CompanySettingsResponse.model_validate(settings)


@company_settings_router.put(
    "",
    response_model=CompanySettingsResponse,
    summary="Update company settings",
)
def update_company_settings(
    request: UpdateCompanySettingsRequest,
    current_user: AuthenticatedUserContext = Depends(
        require_roles([UserAccountRole.COMPANY_ADMIN, UserAccountRole.SUPER_ADMIN])
    ),
    database_session: Session = Depends(get_database_session),
):
    """Update the company settings for the current organization."""
    settings = (
        database_session.query(CompanySettingsRecord)
        .filter(CompanySettingsRecord.organization_id == current_user.organization_id)
        .first()
    )
    if settings is None:
        raise HTTPException(status_code=404, detail="Company settings not found")

    update_data = request.model_dump(exclude_unset=True)
    for field_name, field_value in update_data.items():
        if field_value is not None:
            setattr(settings, field_name, field_value)
    database_session.commit()
    database_session.refresh(settings)
    return CompanySettingsResponse.model_validate(settings)
