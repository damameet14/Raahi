"""Status vocabularies for the ride coordination domain.

Centralizing these string values keeps services and persistence in
agreement and avoids magic strings scattered across the module.
"""

import enum


class RideRequestStatus(str, enum.Enum):
    """Lifecycle of a passenger's ride request.

    PENDING   — awaiting a matching offer or driver acceptance.
    MATCHED   — fulfilled by exactly one booking.
    CANCELLED — withdrawn by the passenger before matching.
    """

    PENDING = "PENDING"
    MATCHED = "MATCHED"
    CANCELLED = "CANCELLED"


class RideOfferJourneyStatus(str, enum.Enum):
    """Lifecycle of a driver's offered journey.

    OPEN      — published and accepting bookings.
    FULL      — no remaining seats but not yet started.
    STARTED   — driver has begun the journey; live tracking is active.
    COMPLETED — journey finished; all bookings settled.
    CANCELLED — withdrawn by the driver before starting.
    """

    OPEN = "OPEN"
    FULL = "FULL"
    STARTED = "STARTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class RideBookingTripStatus(str, enum.Enum):
    """Lifecycle of a single passenger's seat on a journey.

    BOOKED    — confirmed; OTP issued to the passenger.
    STARTED   — driver verified the OTP at pickup; trip is underway.
    COMPLETED — passenger dropped at destination.
    CANCELLED — booking cancelled before pickup.
    """

    BOOKED = "BOOKED"
    STARTED = "STARTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
