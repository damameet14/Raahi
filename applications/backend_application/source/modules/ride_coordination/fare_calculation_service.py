"""Server-authoritative fare calculation.

Fare = distance_km x travel_cost_per_km x seats x driver-profit multiplier.
The multiplier gives the driver a fixed margin over operating cost. The
client never computes fare; it only displays what the server returns.
"""

# Fraction added on top of raw travel cost as the driver's profit (10%).
_DRIVER_PROFIT_MULTIPLIER = 1.10


def calculate_ride_fare_amount(
    *,
    distance_kilometers: float,
    travel_cost_per_kilometer: float,
    seats_requested: int,
) -> float:
    """Return the fare for a trip, rounded to two decimal places."""
    raw_fare = (
        distance_kilometers
        * travel_cost_per_kilometer
        * seats_requested
        * _DRIVER_PROFIT_MULTIPLIER
    )
    return round(raw_fare, 2)
