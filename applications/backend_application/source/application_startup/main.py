"""Raahi Backend Application — FastAPI entry point.

This module assembles the FastAPI application, initializes the database,
mounts all module routers, and seeds demo data on first startup.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from source.application_startup.application_configuration import (
    create_application_configuration,
)
from source.application_startup.database_connection import (
    initialize_database,
    get_database_session,
)
from source.shared_infrastructure.base_database_model import BaseDatabaseModel
from source.shared_infrastructure.current_authenticated_user_dependency import (
    configure_authentication_dependency,
)

# Import all models so SQLAlchemy registers them before create_all
from source.modules.organization_management.organization_record_model import OrganizationRecord  # noqa: F401
from source.modules.administrator_authentication.user_account_record_model import UserAccountRecord  # noqa: F401
from source.modules.employee_management.employee_record_model import EmployeeRecord  # noqa: F401
from source.modules.vehicle_management.vehicle_record_model import VehicleRecord  # noqa: F401
from source.modules.trip_statistics.trip_record_model import TripRecord  # noqa: F401
from source.modules.company_settings.company_settings_record_model import CompanySettingsRecord  # noqa: F401
from source.modules.ride_coordination.ride_request_record_model import RideRequestRecord  # noqa: F401
from source.modules.ride_coordination.ride_offer_record_model import RideOfferRecord  # noqa: F401
from source.modules.ride_coordination.ride_booking_record_model import RideBookingRecord  # noqa: F401
from source.modules.ride_coordination.live_location_ping_record_model import LiveLocationPingRecord  # noqa: F401
from source.modules.employee_self_service.saved_place_record_model import SavedPlaceRecord  # noqa: F401
from source.modules.payment_processing.payment_record_model import PaymentRecord  # noqa: F401
from source.modules.wallet.wallet_record_model import WalletRecord  # noqa: F401
from source.modules.wallet.wallet_transaction_record_model import WalletTransactionRecord  # noqa: F401
from source.modules.journey_chat.chat_message_record_model import ChatMessageRecord  # noqa: F401

# Import routers
from source.modules.administrator_authentication.administrator_authentication_http_routes import (
    administrator_authentication_router,
)
from source.modules.employee_management.employee_management_http_routes import (
    employee_management_router,
)
from source.modules.vehicle_management.vehicle_management_http_routes import (
    vehicle_management_router,
)
from source.modules.organization_management.organization_management_http_routes import (
    organization_management_router,
)
from source.modules.company_settings.company_settings_http_routes import (
    company_settings_router,
)
from source.modules.trip_statistics.trip_statistics_http_routes import (
    trip_statistics_router,
)
from source.modules.dashboard_statistics.dashboard_statistics_http_routes import (
    dashboard_statistics_router,
)
from source.modules.administrator_profile.administrator_profile_http_routes import (
    administrator_profile_router,
)
from source.modules.employee_self_service.employee_self_service_http_routes import (
    employee_self_service_router,
)
from source.modules.ride_coordination.ride_discovery_http_routes import (
    ride_discovery_router,
)
from source.modules.ride_coordination.ride_trip_http_routes import (
    ride_trip_router,
)
from source.modules.wallet.wallet_http_routes import (
    wallet_router,
)
from source.modules.payment_processing.payment_processing_http_routes import (
    payment_processing_router,
)
from source.modules.journey_chat.journey_chat_http_routes import (
    journey_chat_router,
)

from source.database_seed.seed_demo_data import seed_demo_data


configuration = create_application_configuration()


# Columns added to existing tables after their initial release. Each entry is
# a column name mapped to the SQL fragment used to add it. On startup any
# missing column is added so pre-existing development databases keep working
# without a full migration tool. Production should use Alembic instead.
_DEVELOPMENT_SCHEMA_ADDITIONS: dict[str, dict[str, str]] = {
    "user_account_records": {
        "must_change_password": "BOOLEAN NOT NULL DEFAULT FALSE",
    },
    "employee_records": {
        "office_latitude": "FLOAT",
        "office_longitude": "FLOAT",
        "onboarding_completed": "BOOLEAN NOT NULL DEFAULT FALSE",
        "home_address_label": "VARCHAR(500)",
        "office_address_label": "VARCHAR(500)",
    },
    "company_settings_records": {
        "pickup_match_radius_kilometers": "FLOAT NOT NULL DEFAULT 2.0",
        "drop_match_radius_kilometers": "FLOAT NOT NULL DEFAULT 3.0",
    },
    "ride_booking_records": {
        "payment_status": "VARCHAR(20) NOT NULL DEFAULT 'UNPAID'",
    },
}


def ensure_development_schema_compatibility() -> None:
    """Add any missing columns to existing development database tables."""
    from source.application_startup.database_connection import _engine

    if _engine is None:
        return

    database_inspector = inspect(_engine)
    existing_table_names = set(database_inspector.get_table_names())

    for table_name, column_definitions in _DEVELOPMENT_SCHEMA_ADDITIONS.items():
        if table_name not in existing_table_names:
            continue
        existing_column_names = {
            column["name"] for column in database_inspector.get_columns(table_name)
        }
        for column_name, column_type_clause in column_definitions.items():
            if column_name in existing_column_names:
                continue
            with _engine.begin() as connection:
                connection.execute(
                    text(
                        f"ALTER TABLE {table_name} "
                        f"ADD COLUMN {column_name} {column_type_clause}"
                    )
                )


@asynccontextmanager
async def application_lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # Startup
    engine = initialize_database(configuration)
    configure_authentication_dependency(
        secret=configuration.jwt_secret,
        algorithm=configuration.jwt_algorithm,
    )

    # Create tables (development convenience; use Alembic in production)
    BaseDatabaseModel.metadata.create_all(bind=engine)
    ensure_development_schema_compatibility()

    # Seed demo data on first run
    from source.application_startup.database_connection import _session_factory
    if _session_factory is not None:
        session = _session_factory()
        try:
            seed_demo_data(session)
        finally:
            session.close()

    print("[OK] Raahi backend application started successfully")
    print(f"  Database: {configuration.database_url[:50]}...")
    print(f"  Swagger docs: http://localhost:8001/docs")

    yield

    # Shutdown
    print("Raahi backend application shutting down...")


app = FastAPI(
    title="Raahi — Enterprise Carpooling Platform",
    description="REST API for the Raahi enterprise carpooling platform. "
    "Supports multi-tenant organization management, employee and vehicle "
    "management, trip tracking, and administration.",
    version="1.0.0",
    lifespan=application_lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        configuration.frontend_url,
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all module routers
app.include_router(administrator_authentication_router)
app.include_router(employee_management_router)
app.include_router(vehicle_management_router)
app.include_router(organization_management_router)
app.include_router(company_settings_router)
app.include_router(trip_statistics_router)
app.include_router(dashboard_statistics_router)
app.include_router(administrator_profile_router)
app.include_router(employee_self_service_router)
app.include_router(ride_discovery_router)
app.include_router(ride_trip_router)
app.include_router(wallet_router)
app.include_router(payment_processing_router)
app.include_router(journey_chat_router)


@app.get("/api/v1/health", tags=["Health"])
def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "application": "raahi-backend"}
