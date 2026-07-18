"""Public operations for company settings module."""

from sqlalchemy.orm import Session

from source.modules.company_settings.company_settings_record_model import (
    CompanySettingsRecord,
)


def create_default_company_settings(
    *,
    organization_id: str,
    database_session: Session,
) -> CompanySettingsRecord:
    """Create default carpooling settings for a new organization."""
    company_settings = CompanySettingsRecord(organization_id=organization_id)
    database_session.add(company_settings)
    return company_settings
