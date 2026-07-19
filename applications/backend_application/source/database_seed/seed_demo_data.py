"""Seed the database with demo data for development.

Seeds a Raahi platform super-admin and two APPROVED Gujarat tenant
organizations, each with employees (and their login accounts), vehicles, a
fleet of completed trips, and default company settings. The seed is idempotent
— it checks for the platform organization before inserting anything.
"""

from sqlalchemy.orm import Session

from source.modules.organization_management.organization_record_model import OrganizationRecord
from source.modules.administrator_authentication.user_account_record_model import UserAccountRecord
from source.modules.administrator_authentication.password_security import hash_plain_text_password
from source.modules.employee_management.employee_record_model import EmployeeRecord
from source.modules.vehicle_management.vehicle_record_model import VehicleRecord
from source.modules.trip_statistics.trip_record_model import TripRecord
from source.modules.company_settings.company_settings_record_model import CompanySettingsRecord
from source.shared_infrastructure.base_database_model import generate_unique_identifier
from source.shared_infrastructure.user_account_role import UserAccountRole
from source.database_seed.demo_data_definitions import (
    PLATFORM_ORGANIZATION,
    SUPER_ADMIN_USER,
    TENANT_DEFINITIONS,
    build_company_settings,
    generate_employees_for_tenant,
    generate_vehicles_for_tenant,
    generate_trips_for_tenant,
)

# Known demo passwords. must_change_password is left False so demo accounts can
# sign in directly without the first-login password change.
DEMO_ADMIN_PASSWORD = "admin123"
DEMO_EMPLOYEE_PASSWORD = "employee123"


def _seed_platform_super_admin(database_session: Session) -> None:
    """Create the platform organization and the Raahi super-admin account."""
    platform_organization = OrganizationRecord(**PLATFORM_ORGANIZATION)
    database_session.add(platform_organization)
    database_session.flush()

    super_admin_data = {
        key: value
        for key, value in SUPER_ADMIN_USER.items()
        if key != "plain_text_password"
    }
    super_admin_data["password_hash"] = hash_plain_text_password(
        SUPER_ADMIN_USER["plain_text_password"]
    )
    database_session.add(UserAccountRecord(**super_admin_data))
    database_session.flush()


def _seed_tenant(database_session: Session, tenant: dict) -> None:
    """Seed one approved tenant: org, admin, settings, employees, vehicles, trips."""
    organization = OrganizationRecord(**tenant["organization"])
    database_session.add(organization)
    database_session.flush()

    # Company admin (active, ready to sign in).
    admin_user = UserAccountRecord(
        id=tenant["admin"]["id"],
        organization_id=organization.id,
        email=tenant["admin"]["email"],
        password_hash=hash_plain_text_password(DEMO_ADMIN_PASSWORD),
        full_name=tenant["admin"]["full_name"],
        role=UserAccountRole.COMPANY_ADMIN.value,
        must_change_password=False,
        is_active=True,
    )
    database_session.add(admin_user)
    database_session.flush()

    # Company settings.
    database_session.add(CompanySettingsRecord(**build_company_settings(tenant)))

    # Employees + their EMPLOYEE login accounts.
    employee_password_hash = hash_plain_text_password(DEMO_EMPLOYEE_PASSWORD)
    employee_definitions = generate_employees_for_tenant(tenant)
    employee_ids: list[str] = []
    driver_employee_ids: list[str] = []

    for employee_data in employee_definitions:
        employee_account = UserAccountRecord(
            organization_id=organization.id,
            email=employee_data["email"],
            password_hash=employee_password_hash,
            full_name=employee_data["full_name"],
            role=UserAccountRole.EMPLOYEE.value,
            must_change_password=False,
            is_active=employee_data["status"] == "ACTIVE",
        )
        database_session.add(employee_account)
        database_session.flush()

        employee_id = generate_unique_identifier()
        employee_ids.append(employee_id)
        if employee_data["is_driver"] and employee_data["status"] == "ACTIVE":
            driver_employee_ids.append(employee_id)

        database_session.add(
            EmployeeRecord(
                id=employee_id,
                organization_id=organization.id,
                user_account_id=employee_account.id,
                **employee_data,
            )
        )
    database_session.flush()

    # Vehicles, owned by driver employees.
    vehicle_definitions = generate_vehicles_for_tenant(tenant)
    vehicle_ids: list[str] = []
    owner_pool = driver_employee_ids or employee_ids
    for index, vehicle_data in enumerate(vehicle_definitions):
        vehicle_id = generate_unique_identifier()
        vehicle_ids.append(vehicle_id)
        database_session.add(
            VehicleRecord(
                id=vehicle_id,
                organization_id=organization.id,
                owner_employee_id=owner_pool[index % len(owner_pool)],
                **vehicle_data,
            )
        )
    database_session.flush()

    # Completed trips for reporting.
    trip_definitions = generate_trips_for_tenant(
        tenant, employee_ids, driver_employee_ids, vehicle_ids
    )
    for trip_data in trip_definitions:
        database_session.add(TripRecord(**trip_data))

    print(
        f"[Seed]   {organization.name} ({organization.email_domain}): "
        f"{len(employee_definitions)} employees, {len(vehicle_definitions)} vehicles, "
        f"{len(trip_definitions)} trips."
    )


def seed_demo_data(database_session: Session) -> None:
    """Seed the database with demo data if it is empty (idempotent)."""
    existing_platform = (
        database_session.query(OrganizationRecord)
        .filter(OrganizationRecord.id == PLATFORM_ORGANIZATION["id"])
        .first()
    )
    if existing_platform is not None:
        print("[Seed] Demo data already exists. Skipping seed.")
        return

    print("[Seed] Seeding demo data (super-admin + 2 Gujarat tenants)...")
    _seed_platform_super_admin(database_session)
    for tenant in TENANT_DEFINITIONS:
        _seed_tenant(database_session, tenant)

    database_session.commit()

    print("[Seed] Demo data seeded successfully!")
    print(f"       Super-admin: {SUPER_ADMIN_USER['email']} / {SUPER_ADMIN_USER['plain_text_password']}")
    for tenant in TENANT_DEFINITIONS:
        print(f"       Company admin: {tenant['admin']['email']} / {DEMO_ADMIN_PASSWORD}")
    print(f"       Employees (all): <employee_email> / {DEMO_EMPLOYEE_PASSWORD}")
