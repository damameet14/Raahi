"""Pydantic contracts for employee management operations."""

from pydantic import BaseModel, Field
from datetime import datetime


class CreateEmployeeRequest(BaseModel):
    """Request to create a new employee record."""

    employee_code: str = Field(..., min_length=1, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    department: str = Field(..., min_length=1, max_length=100)
    designation: str = Field(..., min_length=1, max_length=100)
    is_driver: bool = Field(default=False)
    home_latitude: float | None = None
    home_longitude: float | None = None


class UpdateEmployeeRequest(BaseModel):
    """Request to update an existing employee record."""

    full_name: str | None = Field(default=None, max_length=255)
    email: str | None = Field(default=None, max_length=255)
    phone: str | None = Field(default=None, max_length=20)
    department: str | None = Field(default=None, max_length=100)
    designation: str | None = Field(default=None, max_length=100)
    status: str | None = Field(default=None, max_length=20)
    is_driver: bool | None = None
    home_latitude: float | None = None
    home_longitude: float | None = None


class EmployeeResponse(BaseModel):
    """Public representation of an employee record."""

    id: str
    organization_id: str
    employee_code: str
    full_name: str
    email: str
    phone: str | None
    department: str
    designation: str
    status: str
    is_driver: bool
    home_latitude: float | None
    home_longitude: float | None
    office_latitude: float | None
    office_longitude: float | None
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CreateEmployeeResponse(EmployeeResponse):
    """Employee creation result including the one-time temporary password.

    The temporary password is shown to the administrator exactly once so
    they can hand it to the employee; it is never persisted in plain text
    and never returned by any subsequent read.
    """

    temporary_password: str


class ResetEmployeePasswordResponse(BaseModel):
    """Result of regenerating an employee's temporary login password."""

    employee_id: str
    temporary_password: str
