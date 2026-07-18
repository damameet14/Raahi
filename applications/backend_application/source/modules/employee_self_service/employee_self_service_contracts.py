"""Pydantic contracts for employee self-service operations."""

from pydantic import BaseModel, Field


class OnboardingVehicleDetails(BaseModel):
    """Vehicle details captured during onboarding when the employee drives."""

    make_and_model: str = Field(..., min_length=1, max_length=100)
    vehicle_number: str = Field(..., min_length=1, max_length=20)
    maximum_passengers: int = Field(..., ge=1, le=20)


class SubmitOnboardingRequest(BaseModel):
    """First-login onboarding submission.

    Home and office coordinates are mandatory. Vehicle details are required
    only when has_vehicle is true, in which case the employee becomes a
    driver and the vehicle is registered.
    """

    has_vehicle: bool
    vehicle: OnboardingVehicleDetails | None = None
    home_latitude: float = Field(..., ge=-90, le=90)
    home_longitude: float = Field(..., ge=-180, le=180)
    home_address_label: str | None = Field(default=None, max_length=500)
    office_latitude: float = Field(..., ge=-90, le=90)
    office_longitude: float = Field(..., ge=-180, le=180)
    office_address_label: str | None = Field(default=None, max_length=500)


class UpdateEmployeeAddressesRequest(BaseModel):
    """Request for an employee to update their saved home/office addresses."""

    home_latitude: float = Field(..., ge=-90, le=90)
    home_longitude: float = Field(..., ge=-180, le=180)
    home_address_label: str | None = Field(default=None, max_length=500)
    office_latitude: float = Field(..., ge=-90, le=90)
    office_longitude: float = Field(..., ge=-180, le=180)
    office_address_label: str | None = Field(default=None, max_length=500)


class RegisterVehicleRequest(BaseModel):
    """Request for an employee to register one of their own vehicles."""

    make: str = Field(..., min_length=1, max_length=100)
    model: str = Field(..., min_length=1, max_length=100)
    vehicle_number: str = Field(..., min_length=1, max_length=20)
    maximum_passengers: int = Field(..., ge=1, le=20)
    fuel_type: str = Field(default="PETROL", max_length=20)
    color: str | None = Field(default=None, max_length=50)


class UpdateVehicleRequest(BaseModel):
    """Request for an employee to update one of their own vehicles."""

    make: str | None = Field(default=None, min_length=1, max_length=100)
    model: str | None = Field(default=None, min_length=1, max_length=100)
    vehicle_number: str | None = Field(default=None, min_length=1, max_length=20)
    maximum_passengers: int | None = Field(default=None, ge=1, le=20)
    fuel_type: str | None = Field(default=None, max_length=20)
    color: str | None = Field(default=None, max_length=50)


class VehicleSummary(BaseModel):
    """Compact vehicle representation for the employee application."""

    id: str
    make: str
    model: str
    vehicle_number: str
    maximum_passengers: int
    fuel_type: str
    color: str | None

    model_config = {"from_attributes": False}


class CreateSavedPlaceRequest(BaseModel):
    """Request for an employee to save a frequent location."""

    label: str = Field(..., min_length=1, max_length=80)
    address_label: str | None = Field(default=None, max_length=500)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class UpdateSavedPlaceRequest(BaseModel):
    """Request for an employee to update a saved location."""

    label: str | None = Field(default=None, min_length=1, max_length=80)
    address_label: str | None = Field(default=None, max_length=500)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)


class SavedPlaceResponse(BaseModel):
    """Employee-facing saved place response."""

    id: str
    label: str
    address_label: str | None
    latitude: float
    longitude: float

    model_config = {"from_attributes": True}


class EmployeeProfileResponse(BaseModel):
    """The authenticated employee's own profile and derived capabilities."""

    id: str
    organization_id: str
    employee_code: str
    full_name: str
    email: str
    phone: str | None
    department: str
    designation: str
    is_driver: bool
    onboarding_completed: bool
    home_latitude: float | None
    home_longitude: float | None
    home_address_label: str | None
    office_latitude: float | None
    office_longitude: float | None
    office_address_label: str | None
    vehicles: list[VehicleSummary]
    can_offer_ride: bool
