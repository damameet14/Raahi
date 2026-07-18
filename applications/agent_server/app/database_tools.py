"""Allow-listed read-only ERP database tools with role and tenant filters."""

from sqlalchemy import text
from sqlalchemy.engine import Engine

from app.security import ChatbotUserSecurityContext


class ReadOnlyERPDatabaseTools:
    """High-value safe tools for the current Raahi carpooling schema."""

    def __init__(self, erp_database_engine: Engine):
        self.erp_database_engine = erp_database_engine

    def summarize_accessible_records(self, user_context: ChatbotUserSecurityContext) -> str:
        """Return organization summary for admins or personal summary for employees."""
        if not user_context.is_authenticated:
            return "You need to log in before I can access ERP information for your account. Please provide your registered email address or phone number."
        if user_context.role in {"COMPANY_ADMIN", "SUPER_ADMIN"}:
            return self.create_admin_summary(user_context)
        return self.create_employee_summary(user_context)

    def create_admin_summary(self, user_context: ChatbotUserSecurityContext) -> str:
        """Read organization-level metrics scoped to the authenticated company."""
        with self.erp_database_engine.connect() as connection:
            row = connection.execute(
                text("""
                    SELECT
                        (SELECT count(*) FROM employee_records WHERE organization_id = :organization_id) AS employee_count,
                        (SELECT count(*) FROM vehicle_records WHERE organization_id = :organization_id) AS vehicle_count,
                        (SELECT count(*) FROM trip_records WHERE organization_id = :organization_id) AS trip_count,
                        (SELECT coalesce(sum(distance_kilometers), 0) FROM trip_records WHERE organization_id = :organization_id) AS total_distance
                """),
                {"organization_id": user_context.organization_id},
            ).mappings().one()
        return (
            f"Your organization currently has {row['employee_count']} employees, "
            f"{row['vehicle_count']} registered vehicles, {row['trip_count']} trips, "
            f"and {float(row['total_distance']):.0f} km of recorded shared travel."
        )

    def create_employee_summary(self, user_context: ChatbotUserSecurityContext) -> str:
        """Read employee-owned trip and vehicle data only."""
        with self.erp_database_engine.connect() as connection:
            row = connection.execute(
                text("""
                    SELECT
                        (SELECT count(*) FROM vehicle_records WHERE owner_employee_id = :employee_id AND organization_id = :organization_id) AS vehicle_count,
                        (SELECT count(*) FROM trip_records WHERE driver_employee_id = :employee_id AND organization_id = :organization_id) AS driven_trip_count,
                        (SELECT coalesce(sum(trip_cost), 0) FROM trip_records WHERE driver_employee_id = :employee_id AND organization_id = :organization_id) AS total_trip_cost
                """),
                {"employee_id": user_context.employee_id, "organization_id": user_context.organization_id},
            ).mappings().one()
        return (
            f"You have {row['vehicle_count']} registered vehicles, "
            f"{row['driven_trip_count']} driven trips, and INR {float(row['total_trip_cost']):.2f} in recorded trip cost."
        )

    def get_latest_trip(self, user_context: ChatbotUserSecurityContext) -> str:
        """Return the latest accessible trip without exposing cross-tenant data."""
        if not user_context.is_authenticated:
            return "You need to log in before I can access ERP trip information."
        where_clause = "organization_id = :organization_id"
        parameters = {"organization_id": user_context.organization_id}
        if user_context.role == "EMPLOYEE":
            where_clause += " AND driver_employee_id = :employee_id"
            parameters["employee_id"] = user_context.employee_id
        with self.erp_database_engine.connect() as connection:
            row = connection.execute(
                text(f"""
                    SELECT id, start_location_name, end_location_name, status, trip_cost
                    FROM trip_records
                    WHERE {where_clause}
                    ORDER BY completed_at DESC NULLS LAST, created_at DESC
                    LIMIT 1
                """),
                parameters,
            ).mappings().first()
        if row is None:
            return "I could not find any accessible trips for your account."
        return (
            f"Latest trip {row['id']} went from {row['start_location_name']} to "
            f"{row['end_location_name']}. Status: {row['status']}. Cost: INR {float(row['trip_cost']):.2f}."
        )
