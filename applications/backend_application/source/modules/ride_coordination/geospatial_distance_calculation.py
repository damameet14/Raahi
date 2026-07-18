"""Great-circle distance between two geographic coordinates.

Used for proximity matching (how close two pickup or drop points are).
This is straight-line distance; road distance for fare comes from the
route distance service.
"""

import math

_EARTH_RADIUS_KILOMETERS = 6371.0088


def calculate_straight_line_distance_kilometers(
    *,
    first_latitude: float,
    first_longitude: float,
    second_latitude: float,
    second_longitude: float,
) -> float:
    """Return the haversine distance in kilometers between two points."""
    first_latitude_radians = math.radians(first_latitude)
    second_latitude_radians = math.radians(second_latitude)
    latitude_difference_radians = math.radians(second_latitude - first_latitude)
    longitude_difference_radians = math.radians(second_longitude - first_longitude)

    haversine_term = (
        math.sin(latitude_difference_radians / 2) ** 2
        + math.cos(first_latitude_radians)
        * math.cos(second_latitude_radians)
        * math.sin(longitude_difference_radians / 2) ** 2
    )
    central_angle = 2 * math.asin(min(1.0, math.sqrt(haversine_term)))
    return _EARTH_RADIUS_KILOMETERS * central_angle
