"""Pydantic contracts for the ride coordination API.

Grouped by sub-feature: shared geography and fare, Find-a-Ride requests,
Offer-a-Ride offers, bookings, and live trip tracking. These are the
transport shapes; persistence models live in the *_record_model files.
"""

from datetime import date, datetime

from pydantic import BaseModel, Field


# ── Shared geography and fare ─────────────────────────────────────────

class GeographicPoint(BaseModel):
    """A latitude/longitude pair with an optional human-readable label."""

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    label: str | None = Field(default=None, max_length=500)


class FareEstimateRequest(BaseModel):
    """Request a fare quote for a source-to-destination trip."""

    source: GeographicPoint
    destination: GeographicPoint
    seats_requested: int = Field(default=1, ge=1, le=20)


class FareEstimateResponse(BaseModel):
    """Server-authoritative fare quote for a trip."""

    distance_kilometers: float
    fare_amount: float
    currency: str


# ── Find a Ride: passenger requests ───────────────────────────────────

class CreateRideRequestRequest(BaseModel):
    """Passenger's request to find a ride (Find a Ride, screen 1A)."""

    source: GeographicPoint
    destination: GeographicPoint
    travel_date: date
    departure_time: str = Field(..., pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    seats_requested: int = Field(default=1, ge=1, le=20)
    is_recurring: bool = False
    recurrence_days: list[str] | None = None
    recurrence_time: str | None = Field(
        default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$"
    )


class RideRequestResponse(BaseModel):
    """Public representation of a passenger ride request."""

    id: str
    status: str
    source_latitude: float
    source_longitude: float
    source_label: str | None
    destination_latitude: float
    destination_longitude: float
    destination_label: str | None
    travel_date: date
    departure_time: str
    seats_requested: int
    is_recurring: bool
    recurrence_days: str | None
    recurrence_time: str | None
    estimated_distance_kilometers: float | None
    estimated_fare_amount: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchingOfferResponse(BaseModel):
    """An offer that matches a passenger request, shown for selection (1B.1)."""

    ride_offer_id: str
    driver_full_name: str
    driver_designation: str | None
    vehicle_make_and_model: str
    vehicle_number: str
    source_latitude: float
    source_longitude: float
    source_label: str | None
    destination_latitude: float
    destination_longitude: float
    destination_label: str | None
    travel_date: date
    departure_window_start_time: str
    departure_window_end_time: str
    seats_available: int
    fare_amount: float
    pickup_distance_kilometers: float
    drop_distance_kilometers: float


class CreateRideRequestResponse(BaseModel):
    """Result of creating a ride request: the request plus any matches."""

    ride_request: RideRequestResponse
    matching_offers: list[MatchingOfferResponse]


# ── Offer a Ride: driver offers ───────────────────────────────────────

class CreateRideOfferRequest(BaseModel):
    """Driver's offer to publish a ride (Offer a Ride, screen 2A)."""

    vehicle_id: str
    source: GeographicPoint
    destination: GeographicPoint
    travel_date: date
    departure_window_start_time: str = Field(
        ..., pattern=r"^([01]\d|2[0-3]):[0-5]\d$"
    )
    departure_window_end_time: str = Field(..., pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    seats_offered: int | None = Field(default=None, ge=1, le=20)
    is_recurring: bool = False
    recurrence_days: list[str] | None = None
    recurrence_time: str | None = Field(
        default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$"
    )


class RideOfferResponse(BaseModel):
    """Public representation of a driver ride offer."""

    id: str
    journey_status: str
    vehicle_id: str
    source_latitude: float
    source_longitude: float
    source_label: str | None
    destination_latitude: float
    destination_longitude: float
    destination_label: str | None
    travel_date: date
    departure_window_start_time: str
    departure_window_end_time: str
    seats_total: int
    seats_available: int
    is_recurring: bool
    recurrence_days: str | None
    recurrence_time: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MatchingRequestResponse(BaseModel):
    """A passenger request that matches a driver offer (Suggested Rides, 2B.1)."""

    ride_request_id: str
    passenger_full_name: str
    source_latitude: float
    source_longitude: float
    source_label: str | None
    destination_latitude: float
    destination_longitude: float
    destination_label: str | None
    travel_date: date
    departure_time: str
    seats_requested: int
    fare_amount: float
    pickup_distance_kilometers: float
    drop_distance_kilometers: float


class CreateRideOfferResponse(BaseModel):
    """Result of creating a ride offer: the offer plus any matching requests."""

    ride_offer: RideOfferResponse
    matching_requests: list[MatchingRequestResponse]


class AcceptRideRequestsRequest(BaseModel):
    """Driver accepts one or more matching requests onto an offer (2C)."""

    ride_offer_id: str
    ride_request_ids: list[str] = Field(..., min_length=1)


# ── Bookings ──────────────────────────────────────────────────────────

class BookRideOfferRequest(BaseModel):
    """Passenger books a specific offer for their request (Select Ride, 1C)."""

    ride_request_id: str
    ride_offer_id: str


class RideBookingResponse(BaseModel):
    """A confirmed booking as seen by a participant.

    ``otp_code`` is populated only for the passenger who owns the booking;
    it is always ``None`` in driver-facing responses, because the driver
    must obtain the OTP from the passenger at pickup.
    """

    id: str
    ride_request_id: str
    ride_offer_id: str
    trip_status: str
    ride_offer_journey_status: str
    ride_offer_departure_window_start_time: str | None
    seats_booked: int
    fare_amount: float
    payment_status: str
    otp_code: str | None
    is_otp_verified: bool
    travel_date: date
    departure_time: str
    pickup_latitude: float
    pickup_longitude: float
    pickup_label: str | None
    drop_latitude: float
    drop_longitude: float
    drop_label: str | None
    driver_full_name: str
    driver_phone: str | None
    passenger_full_name: str
    vehicle_make_and_model: str
    vehicle_number: str
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None


class AcceptRideRequestsResponse(BaseModel):
    """Bookings created when a driver accepts matching requests."""

    bookings: list[RideBookingResponse]


class EmployeeRideReportSummaryResponse(BaseModel):
    """Employee-only report metrics derived from completed ride bookings."""

    completed_trips: int
    total_distance_kilometers: float
    total_fare_amount: float
    passenger_spend_amount: float
    driver_earning_amount: float
    seats_shared_as_driver: int
    average_fare_per_trip: float


# ── Live trip tracking ────────────────────────────────────────────────

class PostDriverLocationRequest(BaseModel):
    """A driver's current GPS sample during an active journey."""

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class DriverLocationResponse(BaseModel):
    """The most recent driver location for a journey."""

    ride_offer_id: str
    latitude: float
    longitude: float
    recorded_at: datetime


class BookingTrackingResponse(BaseModel):
    """Live tracking payload a passenger polls for their booking."""

    booking_id: str
    trip_status: str
    driver_location: DriverLocationResponse | None
    pickup_latitude: float
    pickup_longitude: float
    drop_latitude: float
    drop_longitude: float
    driver_full_name: str
    vehicle_make_and_model: str
    vehicle_number: str


class VerifyBookingOtpRequest(BaseModel):
    """Driver-submitted OTP to start a passenger's leg of the trip."""

    otp_code: str = Field(..., pattern=r"^\d{4}$")
