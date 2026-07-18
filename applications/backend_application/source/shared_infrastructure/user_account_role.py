"""User role enumeration for role-based access control."""

import enum


class UserAccountRole(str, enum.Enum):
    """Roles available in the Raahi platform.

    SUPER_ADMIN — Platform-level administrator (future use).
    COMPANY_ADMIN — Company/organization administrator.
    EMPLOYEE — Regular employee (future use for mobile app).
    """

    SUPER_ADMIN = "SUPER_ADMIN"
    COMPANY_ADMIN = "COMPANY_ADMIN"
    EMPLOYEE = "EMPLOYEE"
