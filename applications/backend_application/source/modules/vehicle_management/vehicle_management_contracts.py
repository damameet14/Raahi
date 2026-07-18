"""Pydantic contracts for vehicle management operations."""

from pydantic import BaseModel, Field
from datetime import date, datetime


class CreateVehicleRequest(BaseModel):
    """Request to register a new vehicle."""

    vehicle_number: str = Field(..., min_length=1, max_length=20)
    owner_employee_id: str = Field(...)
    make: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    year: int | None = None
    color: str | None = Field(default=None, max_length=50)
    capacity: int = Field(default=4, ge=1, le=20)
    fuel_type: str = Field(default="PETROL", max_length=20)
    insurance_expiry_date: date | None = None


class UpdateVehicleRequest(BaseModel):
    """Request to update an existing vehicle."""

    vehicle_number: str | None = Field(default=None, max_length=20)
    owner_employee_id: str | None = None
    make: str | None = Field(default=None, max_length=100)
    model: str | None = Field(default=None, max_length=100)
    year: int | None = None
    color: str | None = Field(default=None, max_length=50)
    capacity: int | None = Field(default=None, ge=1, le=20)
    fuel_type: str | None = Field(default=None, max_length=20)
    status: str | None = Field(default=None, max_length=20)
    insurance_expiry_date: date | None = None


class VehicleResponse(BaseModel):
    """Public representation of a vehicle record."""

    id: str
    organization_id: str
    vehicle_number: str
    owner_employee_id: str
    make: str
    model: str
    year: int | None
    color: str | None
    capacity: int
    fuel_type: str
    status: str
    insurance_expiry_date: date | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
