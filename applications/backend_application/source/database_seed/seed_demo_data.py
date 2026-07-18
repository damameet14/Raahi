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
from source.database_seed.demo_data_definitions import (
    DEMO_ORGANIZATION,
    DEMO_ADMIN_USER,
    DEMO_EMPLOYEES,
    DEMO_VEHICLES,
    DEMO_COMPANY_SETTINGS,
    generate_demo_trip_records,
)


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
        print("[Seed] Demo data already exists. Skipping.")
        return

    print("[Seed] Seeding demo data...")

    # 1. Organization
    organization = OrganizationRecord(**DEMO_ORGANIZATION)
    database_session.add(organization)

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

    # 3. Employees
    employee_ids = []
    for employee_data in DEMO_EMPLOYEES:
        employee_id = generate_unique_identifier()
        employee_ids.append(employee_id)
        employee = EmployeeRecord(
            id=employee_id,
            organization_id=DEMO_ORGANIZATION["id"],
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
