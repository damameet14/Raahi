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
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
