"""HTTP routes for Raahi platform (super-admin) administration.

These endpoints govern the tenant onboarding lifecycle: a super-admin lists
pending organizations and approves or rejects them. Approval activates the
company's admin account with a fresh temporary password (emailed), and
rejection records a reason and notifies the applicant.

All routes require the SUPER_ADMIN role.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from source.application_startup.database_connection import get_database_session
from source.application_startup.application_configuration import (
    ApplicationConfiguration,
    create_application_configuration,
)
from source.modules.administrator_authentication.public_interface import (
    reset_login_account_to_temporary_password,
)
from source.modules.administrator_authentication.user_account_record_model import (
    UserAccountRecord,
)
from source.modules.notifications.public_interface import (
    notify_organization_approved,
    notify_organization_rejected,
)
from source.modules.organization_management.organization_record_model import (
    OrganizationRecord,
)
from source.modules.organization_management.organization_approval_status import (
    OrganizationApprovalStatus,
)
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
    require_roles,
)
from source.shared_infrastructure.user_account_role import UserAccountRole


platform_administration_router = APIRouter(
    prefix="/api/v1/platform",
    tags=["Platform Administration"],
)

require_super_admin = require_roles([UserAccountRole.SUPER_ADMIN])


class OnboardingOrganizationResponse(BaseModel):
    """An organization as seen by a platform super-admin."""

    id: str
    name: str
    slug: str
    email_domain: str | None
    industry: str | None
    address: str | None
    approval_status: str
    rejection_reason: str | None
    is_active: bool
    administrator_email: str | None
    administrator_full_name: str | None
    created_at: datetime
    updated_at: datetime


class RejectOrganizationRequest(BaseModel):
    """Reason for declining an onboarding request."""

    rejection_reason: str = Field(..., min_length=3, max_length=500)


class ApproveOrganizationResponse(BaseModel):
    """Result of approving a tenant, including one-time admin credentials."""

    organization: OnboardingOrganizationResponse
    administrator_email: str
    temporary_password: str
    message: str


def _find_company_administrator(
    *, organization_id: str, database_session: Session
) -> UserAccountRecord | None:
    """Return the first company-admin account for an organization, if any."""
    return (
        database_session.query(UserAccountRecord)
        .filter(
            UserAccountRecord.organization_id == organization_id,
            UserAccountRecord.role == UserAccountRole.COMPANY_ADMIN.value,
        )
        .order_by(UserAccountRecord.created_at.asc())
        .first()
    )


def _to_onboarding_response(
    *, organization: OrganizationRecord, database_session: Session
) -> OnboardingOrganizationResponse:
    """Build the super-admin view of an organization with its admin contact."""
    administrator = _find_company_administrator(
        organization_id=organization.id, database_session=database_session
    )
    return OnboardingOrganizationResponse(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        email_domain=organization.email_domain,
        industry=organization.industry,
        address=organization.address,
        approval_status=organization.approval_status,
        rejection_reason=organization.rejection_reason,
        is_active=organization.is_active,
        administrator_email=administrator.email if administrator else None,
        administrator_full_name=administrator.full_name if administrator else None,
        created_at=organization.created_at,
        updated_at=organization.updated_at,
    )


@platform_administration_router.get(
    "/organizations",
    response_model=list[OnboardingOrganizationResponse],
    summary="List organizations for onboarding review",
)
def list_organizations(
    approval_status: str | None = None,
    current_user: AuthenticatedUserContext = Depends(require_super_admin),
    database_session: Session = Depends(get_database_session),
):
    """List tenant organizations, optionally filtered by approval status.

    The super-admin's own internal platform organization is excluded so only
    real tenant onboarding requests appear.
    """
    query = database_session.query(OrganizationRecord).filter(
        OrganizationRecord.id != current_user.organization_id
    )
    if approval_status is not None:
        normalized_status = approval_status.strip().upper()
        query = query.filter(
            OrganizationRecord.approval_status == normalized_status
        )
    organizations = query.order_by(OrganizationRecord.created_at.desc()).all()
    return [
        _to_onboarding_response(
            organization=organization, database_session=database_session
        )
        for organization in organizations
    ]


@platform_administration_router.post(
    "/organizations/{organization_id}/approve",
    response_model=ApproveOrganizationResponse,
    summary="Approve a pending organization",
)
def approve_organization(
    organization_id: str,
    _current_user: AuthenticatedUserContext = Depends(require_super_admin),
    database_session: Session = Depends(get_database_session),
    configuration: ApplicationConfiguration = Depends(create_application_configuration),
):
    """Approve a tenant, activate its admin, and issue a temporary password."""
    organization = (
        database_session.query(OrganizationRecord)
        .filter(OrganizationRecord.id == organization_id)
        .first()
    )
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    if organization.approval_status == OrganizationApprovalStatus.APPROVED.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization is already approved",
        )

    administrator = _find_company_administrator(
        organization_id=organization.id, database_session=database_session
    )
    if administrator is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization has no administrator account to activate",
        )

    organization.approval_status = OrganizationApprovalStatus.APPROVED.value
    organization.is_active = True
    organization.rejection_reason = None
    administrator.is_active = True

    temporary_password = reset_login_account_to_temporary_password(
        user_account_id=administrator.id,
        database_session=database_session,
    )
    database_session.commit()
    database_session.refresh(organization)

    notify_organization_approved(
        configuration=configuration,
        administrator_name=administrator.full_name,
        login_email=administrator.email,
        organization_name=organization.name,
        temporary_password=temporary_password,
    )

    return ApproveOrganizationResponse(
        organization=_to_onboarding_response(
            organization=organization, database_session=database_session
        ),
        administrator_email=administrator.email,
        temporary_password=temporary_password,
        message="Organization approved. Temporary credentials emailed to the administrator.",
    )


@platform_administration_router.post(
    "/organizations/{organization_id}/reject",
    response_model=OnboardingOrganizationResponse,
    summary="Reject a pending organization",
)
def reject_organization(
    organization_id: str,
    request: RejectOrganizationRequest,
    _current_user: AuthenticatedUserContext = Depends(require_super_admin),
    database_session: Session = Depends(get_database_session),
    configuration: ApplicationConfiguration = Depends(create_application_configuration),
):
    """Decline a tenant's onboarding request and record the reason."""
    organization = (
        database_session.query(OrganizationRecord)
        .filter(OrganizationRecord.id == organization_id)
        .first()
    )
    if organization is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    organization.approval_status = OrganizationApprovalStatus.REJECTED.value
    organization.rejection_reason = request.rejection_reason.strip()
    organization.is_active = False

    administrator = _find_company_administrator(
        organization_id=organization.id, database_session=database_session
    )
    if administrator is not None:
        administrator.is_active = False

    database_session.commit()
    database_session.refresh(organization)

    if administrator is not None:
        notify_organization_rejected(
            configuration=configuration,
            administrator_name=administrator.full_name,
            administrator_email=administrator.email,
            organization_name=organization.name,
            rejection_reason=organization.rejection_reason,
        )

    return _to_onboarding_response(
        organization=organization, database_session=database_session
    )
