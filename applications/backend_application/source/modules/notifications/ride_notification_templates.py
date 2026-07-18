"""WhatsApp message wording for ride-lifecycle and reminder notifications.

All ride text lives here so the phrasing for every event and recipient is in
one place, separate from delivery. Builders take a neutral
``RideNotificationDetails`` and return a ready-to-send string.
"""

from source.modules.notifications.notification_contracts import (
    RideNotificationDetails,
)


def _route_and_time(details: RideNotificationDetails) -> str:
    """A short 'pickup → destination on date at time' line."""
    pickup = details.pickup_label or "your pickup"
    destination = details.drop_label or "your destination"
    return (
        f"{pickup} → {destination} on {details.travel_date} "
        f"at {details.departure_time}"
    )


def build_booking_confirmed_passenger_message(
    details: RideNotificationDetails,
) -> str:
    return (
        f"Hi {details.passenger_full_name}, your ride is confirmed.\n"
        f"{_route_and_time(details)}\n"
        f"Driver: {details.driver_full_name} · {details.vehicle_description}\n"
        f"Fare: ₹{details.fare_amount:.0f}. Share your pickup OTP with the "
        f"driver to start."
    )


def build_booking_confirmed_driver_message(
    details: RideNotificationDetails,
) -> str:
    return (
        f"Hi {details.driver_full_name}, {details.passenger_full_name} is "
        f"booked on your journey.\n{_route_and_time(details)}"
    )


def build_journey_started_passenger_message(
    details: RideNotificationDetails,
) -> str:
    return (
        f"Hi {details.passenger_full_name}, {details.driver_full_name} has "
        f"started the journey for {_route_and_time(details)}. Keep your "
        f"pickup OTP ready."
    )


def build_pickup_verified_passenger_message(
    details: RideNotificationDetails,
) -> str:
    return (
        f"Hi {details.passenger_full_name}, your trip with "
        f"{details.driver_full_name} has started. Have a safe ride!"
    )


def build_trip_completed_passenger_message(
    details: RideNotificationDetails,
) -> str:
    return (
        f"Hi {details.passenger_full_name}, your trip is complete.\n"
        f"Fare due: ₹{details.fare_amount:.0f}. Pay by cash, card, UPI, or "
        f"wallet in the Raahi app."
    )


def build_booking_cancelled_passenger_message(
    details: RideNotificationDetails,
) -> str:
    return (
        f"Hi {details.passenger_full_name}, your booking for "
        f"{_route_and_time(details)} has been cancelled."
    )


def build_booking_cancelled_driver_message(
    details: RideNotificationDetails,
) -> str:
    return (
        f"Hi {details.driver_full_name}, {details.passenger_full_name} "
        f"cancelled their booking for {_route_and_time(details)}. A seat has "
        f"reopened."
    )


def build_journey_cancelled_passenger_message(
    details: RideNotificationDetails,
) -> str:
    return (
        f"Hi {details.passenger_full_name}, {details.driver_full_name} "
        f"cancelled the journey for {_route_and_time(details)}. Please book "
        f"another ride."
    )


def build_ride_reminder_passenger_message(
    details: RideNotificationDetails,
) -> str:
    return (
        f"Hi {details.passenger_full_name}, your ride departs in about 15 "
        f"minutes.\n{_route_and_time(details)}\nDriver: "
        f"{details.driver_full_name} · {details.vehicle_description}. Please "
        f"be ready at your pickup."
    )


def build_ride_reminder_driver_message(
    *, driver_full_name: str, passenger_count: int, travel_time: str
) -> str:
    return (
        f"Hi {driver_full_name}, your journey departs in about 15 minutes at "
        f"{travel_time} with {passenger_count} passenger(s) to pick up. "
        f"Please get ready."
    )
