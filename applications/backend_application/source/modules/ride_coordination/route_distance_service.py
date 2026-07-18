"""Driving distance between two points for fare calculation.

Uses the Google Directions API when an API key is configured, and falls
back to a road-factor-adjusted straight-line distance when the key is
missing or the request fails. The fallback keeps fare calculation working
offline and in tests while remaining production-accurate with a key.
"""

import httpx

from source.modules.ride_coordination.geospatial_distance_calculation import (
    calculate_straight_line_distance_kilometers,
)

# Multiplier applied to straight-line distance to approximate road distance
# when the Directions API is unavailable. Urban road networks are typically
# 20-40% longer than the great-circle distance.
_STRAIGHT_LINE_TO_ROAD_DISTANCE_FACTOR = 1.3
_GOOGLE_DIRECTIONS_ENDPOINT = "https://maps.googleapis.com/maps/api/directions/json"
_DIRECTIONS_REQUEST_TIMEOUT_SECONDS = 5.0


def estimate_driving_distance_kilometers(
    *,
    source_latitude: float,
    source_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
    google_maps_api_key: str,
) -> float:
    """Return the driving distance in kilometers between two points.

    Falls back to an approximation if the Directions API cannot be used.
    """
    if google_maps_api_key:
        directions_distance = _request_google_directions_distance_kilometers(
            source_latitude=source_latitude,
            source_longitude=source_longitude,
            destination_latitude=destination_latitude,
            destination_longitude=destination_longitude,
            google_maps_api_key=google_maps_api_key,
        )
        if directions_distance is not None:
            return directions_distance

    straight_line_distance = calculate_straight_line_distance_kilometers(
        first_latitude=source_latitude,
        first_longitude=source_longitude,
        second_latitude=destination_latitude,
        second_longitude=destination_longitude,
    )
    return round(straight_line_distance * _STRAIGHT_LINE_TO_ROAD_DISTANCE_FACTOR, 3)


def _request_google_directions_distance_kilometers(
    *,
    source_latitude: float,
    source_longitude: float,
    destination_latitude: float,
    destination_longitude: float,
    google_maps_api_key: str,
) -> float | None:
    """Query Google Directions for driving distance, or None on any failure."""
    query_parameters = {
        "origin": f"{source_latitude},{source_longitude}",
        "destination": f"{destination_latitude},{destination_longitude}",
        "mode": "driving",
        "key": google_maps_api_key,
    }
    try:
        response = httpx.get(
            _GOOGLE_DIRECTIONS_ENDPOINT,
            params=query_parameters,
            timeout=_DIRECTIONS_REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
        payload = response.json()
    except (httpx.HTTPError, ValueError):
        return None

    if payload.get("status") != "OK":
        return None
    routes = payload.get("routes") or []
    if not routes:
        return None
    legs = routes[0].get("legs") or []
    if not legs:
        return None

    total_distance_meters = sum(
        leg.get("distance", {}).get("value", 0) for leg in legs
    )
    if total_distance_meters <= 0:
        return None
    return round(total_distance_meters / 1000.0, 3)
