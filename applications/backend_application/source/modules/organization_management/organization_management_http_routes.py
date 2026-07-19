"""HTTP routes for organization management."""

import re
import secrets
import string
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from datetime import datetime

from source.application_startup.database_connection import get_database_session
from source.application_startup.application_configuration import (
    ApplicationConfiguration,
    create_application_configuration,
)
from source.modules.administrator_authentication.public_interface import (
    create_company_administrator_account,
    does_user_account_exist_for_email,
)
from source.modules.company_settings.public_interface import (
    create_default_company_settings,
)
from source.modules.notifications.public_interface import (
    notify_organization_registration_received,
)
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
    require_roles,
)
from source.shared_infrastructure.user_account_role import UserAccountRole
from source.modules.organization_management.organization_record_model import OrganizationRecord
from source.modules.organization_management.organization_approval_status import (
    OrganizationApprovalStatus,
)


class OrganizationResponse(BaseModel):
    """Public representation of an organization."""

    id: str
    name: str
    slug: str
    email_domain: str | None
    logo_url: str | None
    address: str | None
    industry: str | None
    approval_status: str
    rejection_reason: str | None
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


class RegisterOrganizationRequest(BaseModel):
    """Public request to create an organization and company admin account."""

    organization_name: str = Field(..., min_length=2, max_length=255)
    email_domain: str = Field(..., min_length=3, max_length=255)
    industry: str | None = Field(default=None, max_length=100)
    address: str | None = Field(default=None, max_length=500)
    administrator_full_name: str = Field(..., min_length=2, max_length=255)
    administrator_email: str = Field(..., min_length=5, max_length=255)


class RegisterOrganizationResponse(BaseModel):
    """Response acknowledging a registration that is awaiting review.

    No sign-in credentials are issued here — the administrator receives a
    temporary password by email only once a super-admin approves the tenant.
    """

    organization_id: str
    organization_name: str
    email_domain: str
    administrator_email: str
    approval_status: str
    message: str


organization_management_router = APIRouter(
    prefix="/api/v1/organizations",
    tags=["Organization Management"],
)


def create_slug_from_organization_name(organization_name: str) -> str:
    """Create a stable URL-safe slug from an organization name."""
    normalized_name = organization_name.strip().lower()
    slug = re.sub(r"[^a-z0-9]+", "-", normalized_name).strip("-")
    return slug or "organization"


def create_unique_organization_slug(
    organization_name: str,
    database_session: Session,
) -> str:
    """Create an organization slug that is unique in the database."""
    base_slug = create_slug_from_organization_name(organization_name)
    candidate_slug = base_slug
    suffix_number = 2
    while (
        database_session.query(OrganizationRecord)
        .filter(OrganizationRecord.slug == candidate_slug)
        .first()
        is not None
    ):
        candidate_slug = f"{base_slug}-{suffix_number}"
        suffix_number += 1
    return candidate_slug


def normalize_email_domain(raw_domain: str) -> str:
    """Normalize a submitted email domain to a bare lowercase host.

    Accepts values like "Acme.com", "@acme.com", or "https://acme.com/" and
    returns "acme.com". Raises ValueError when the result is not a plausible
    domain (must contain a dot and only domain-safe characters).
    """
    domain = raw_domain.strip().lower()
    domain = domain.split("//")[-1]  # drop any scheme
    domain = domain.lstrip("@").strip("/")
    domain = domain.split("/")[0]  # drop any path
    domain = domain.split("@")[-1]  # drop any local-part
    if not re.fullmatch(r"[a-z0-9.-]+\.[a-z]{2,}", domain):
        raise ValueError("Invalid email domain")
    return domain


def email_belongs_to_domain(email_address: str, email_domain: str) -> bool:
    """Return whether an email address is under the given domain."""
    _, _, host = email_address.strip().lower().partition("@")
    return host == email_domain.strip().lower()


def generate_temporary_administrator_password() -> str:
    """Generate a readable temporary password for first admin login."""
    alphabet = string.ascii_letters + string.digits
    random_body = "".join(secrets.choice(alphabet) for _ in range(10))
    return f"Raahi-{random_body}!"


@organization_management_router.post(
    "/register",
    response_model=RegisterOrganizationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new organization",
)
def register_organization(
    request: RegisterOrganizationRequest,
    database_session: Session = Depends(get_database_session),
    configuration: ApplicationConfiguration = Depends(create_application_configuration),
):
    """Submit a company tenant for onboarding review.

    Creates the organization (PENDING), its first admin account (inactive
    until approval), and default settings. The administrator receives sign-in
    credentials by email only after a super-admin approves the tenant.
    """
    normalized_email_address = request.administrator_email.strip().lower()

    try:
        normalized_domain = normalize_email_domain(request.email_domain)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid company email domain, e.g. acme.com",
        )

    if not email_belongs_to_domain(normalized_email_address, normalized_domain):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"The administrator email must belong to the @{normalized_domain} domain",
        )

    if does_user_account_exist_for_email(
        email_address=normalized_email_address,
        database_session=database_session,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An administrator account already exists for this email",
        )

    existing_domain_organization = (
        database_session.query(OrganizationRecord)
        .filter(OrganizationRecord.email_domain == normalized_domain)
        .first()
    )
    if existing_domain_organization is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An organization is already registered for @{normalized_domain}",
        )

    # A generated password is stored now but never returned; it is reset to a
    # fresh temporary password (and emailed) at approval time.
    placeholder_password = generate_temporary_administrator_password()
    organization = OrganizationRecord(
        name=request.organization_name.strip(),
        slug=create_unique_organization_slug(
            request.organization_name,
            database_session,
        ),
        email_domain=normalized_domain,
        address=request.address,
        industry=request.industry,
        approval_status=OrganizationApprovalStatus.PENDING.value,
        is_active=False,
    )
    database_session.add(organization)
    database_session.flush()

    administrator_account = create_company_administrator_account(
        organization_id=organization.id,
        administrator_email=normalized_email_address,
        administrator_full_name=request.administrator_full_name.strip(),
        temporary_password=placeholder_password,
        database_session=database_session,
    )
    # Keep the admin account dormant until the organization is approved.
    administrator_account.is_active = False
    create_default_company_settings(
        organization_id=organization.id,
        database_session=database_session,
    )

    try:
        database_session.commit()
    except IntegrityError:
        database_session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization or administrator account already exists",
        )

    notify_organization_registration_received(
        configuration=configuration,
        administrator_name=request.administrator_full_name.strip(),
        administrator_email=administrator_account.email,
        organization_name=organization.name,
    )

    return RegisterOrganizationResponse(
        organization_id=organization.id,
        organization_name=organization.name,
        email_domain=organization.email_domain,
        administrator_email=administrator_account.email,
        approval_status=organization.approval_status,
        message=(
            "Registration received. Your organization is awaiting Raahi review. "
            "You will receive sign-in credentials by email once it is approved."
        ),
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
