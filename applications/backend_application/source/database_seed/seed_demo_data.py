"""Seed the database with demo data for development."""

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
    DEMO_ORGANIZATION,
    DEMO_ADMIN_USER,
    DEMO_EMPLOYEES,
    DEMO_VEHICLES,
    DEMO_COMPANY_SETTINGS,
    generate_demo_trip_records,
)

# Default password for all seeded employee accounts.
# Employees must change this on first login (must_change_password=True).
DEMO_EMPLOYEE_PASSWORD = "employee123"


def _backfill_employee_login_accounts(database_session: Session) -> None:
    """Create missing EMPLOYEE login accounts for already-seeded employees.

    Runs on every startup so that databases created before the employee-
    account seed was added get the accounts without a full re-seed.
    """
    employees_without_account = (
        database_session.query(EmployeeRecord)
        .filter(
            EmployeeRecord.organization_id == DEMO_ORGANIZATION["id"],
            EmployeeRecord.user_account_id.is_(None),
        )
        .all()
    )
    if not employees_without_account:
        return

    password_hash = hash_plain_text_password(DEMO_EMPLOYEE_PASSWORD)
    created_count = 0

    for employee in employees_without_account:
        # Skip if an account already exists for this email
        existing_account = (
            database_session.query(UserAccountRecord)
            .filter(UserAccountRecord.email == employee.email)
            .first()
        )
        if existing_account is not None:
            employee.user_account_id = existing_account.id
            continue

        account = UserAccountRecord(
            organization_id=DEMO_ORGANIZATION["id"],
            email=employee.email,
            password_hash=password_hash,
            full_name=employee.full_name,
            role=UserAccountRole.EMPLOYEE.value,
            must_change_password=True,
            is_active=True,
        )
        database_session.add(account)
        database_session.flush()
        employee.user_account_id = account.id
        created_count += 1

    database_session.commit()
    if created_count > 0:
        print(f"[Seed] Backfilled {created_count} employee login accounts.")
        print(f"       Default password: {DEMO_EMPLOYEE_PASSWORD}")


def seed_demo_data(database_session: Session) -> None:
    """Seed the database with demo data if it is empty.

    This function is idempotent — it checks whether the demo
    organization already exists before inserting anything.
    """
    existing_organization = (
        database_session.query(OrganizationRecord)
        .filter(OrganizationRecord.id == DEMO_ORGANIZATION["id"])
        .first()
    )
    if existing_organization is not None:
        print("[Seed] Demo data already exists. Skipping full seed.")
        # Backfill employee login accounts if missing
        _backfill_employee_login_accounts(database_session)
        return

    print("[Seed] Seeding demo data...")

    # 1. Organization
    organization = OrganizationRecord(**DEMO_ORGANIZATION)
    database_session.add(organization)
    database_session.flush()  # Ensure org exists before FK-dependent inserts

    # 2. Admin user
    admin_data = {
        key: value
        for key, value in DEMO_ADMIN_USER.items()
        if key != "plain_text_password"
    }
    admin_data["password_hash"] = hash_plain_text_password(
        DEMO_ADMIN_USER["plain_text_password"]
    )
    admin_user = UserAccountRecord(**admin_data)
    database_session.add(admin_user)
    database_session.flush()  # Ensure admin exists before employees

    # 3. Employee login accounts + employee records
    employee_password_hash = hash_plain_text_password(DEMO_EMPLOYEE_PASSWORD)
    employee_ids = []
    for employee_data in DEMO_EMPLOYEES:
        # Create an EMPLOYEE login account
        employee_account = UserAccountRecord(
            organization_id=DEMO_ORGANIZATION["id"],
            email=employee_data["email"],
            password_hash=employee_password_hash,
            full_name=employee_data["full_name"],
            role=UserAccountRole.EMPLOYEE.value,
            must_change_password=True,
            is_active=True,
        )
        database_session.add(employee_account)
        database_session.flush()

        # Create the employee record linked to the account
        employee_id = generate_unique_identifier()
        employee_ids.append(employee_id)
        employee = EmployeeRecord(
            id=employee_id,
            organization_id=DEMO_ORGANIZATION["id"],
            user_account_id=employee_account.id,
            **employee_data,
        )
        database_session.add(employee)

    database_session.flush()

    # 4. Vehicles (assigned to driver employees)
    driver_indices = [i for i, emp in enumerate(DEMO_EMPLOYEES) if emp["is_driver"]]
    vehicle_ids = []
    for idx, vehicle_data in enumerate(DEMO_VEHICLES):
        vehicle_id = generate_unique_identifier()
        vehicle_ids.append(vehicle_id)
        owner_index = driver_indices[idx % len(driver_indices)]
        vehicle = VehicleRecord(
            id=vehicle_id,
            organization_id=DEMO_ORGANIZATION["id"],
            owner_employee_id=employee_ids[owner_index],
            **vehicle_data,
        )
        database_session.add(vehicle)

    database_session.flush()

    # 5. Trips
    trip_records_data = generate_demo_trip_records(employee_ids, vehicle_ids)
    for trip_data in trip_records_data:
        trip = TripRecord(**trip_data)
        database_session.add(trip)

    # 6. Company settings
    settings = CompanySettingsRecord(**DEMO_COMPANY_SETTINGS)
    database_session.add(settings)

    database_session.commit()
    print("[Seed] Demo data seeded successfully!")
    print(f"       Admin login: {DEMO_ADMIN_USER['email']} / {DEMO_ADMIN_USER['plain_text_password']}")
    print(f"       Employee login (all): <employee_email> / {DEMO_EMPLOYEE_PASSWORD}")

