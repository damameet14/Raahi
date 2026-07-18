"""Raahi Backend Application — FastAPI entry point.

This module assembles the FastAPI application, initializes the database,
mounts all module routers, and seeds demo data on first startup.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

from source.database_seed.seed_demo_data import seed_demo_data


configuration = create_application_configuration()


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

    # Seed demo data on first run
    from source.application_startup.database_connection import _session_factory
    if _session_factory is not None:
        session = _session_factory()
        try:
            seed_demo_data(session)
        finally:
            session.close()

    print("✓ Raahi backend application started successfully")
    print(f"  Database: {configuration.database_url[:50]}...")
    print(f"  Swagger docs: http://localhost:8000/docs")

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


@app.get("/api/v1/health", tags=["Health"])
def health_check():
    """Simple health check endpoint."""
    return {"status": "healthy", "application": "raahi-backend"}
