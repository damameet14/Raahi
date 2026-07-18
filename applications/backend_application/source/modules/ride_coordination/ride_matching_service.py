"""Proximity- and time-based matching between requests and offers.

A request matches an offer when the pickup points are within the
organization's pickup radius, the drop points are within the drop radius,
the requested departure time falls inside the offer's time window, and the
offer has enough remaining seats. Matching is symmetric: the same rule
decides both "offers for a passenger request" and "requests for a driver
offer".
"""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from source.modules.ride_coordination.ride_request_record_model import (
    RideRequestRecord,
)
from source.modules.ride_coordination.ride_offer_record_model import RideOfferRecord
from source.modules.ride_coordination.ride_coordination_repository import (
    list_open_ride_offers_for_date,
    list_pending_ride_requests_for_date,
)
from source.modules.ride_coordination.geospatial_distance_calculation import (
    calculate_straight_line_distance_kilometers,
)


@dataclass
class MatchedOffer:
    """An offer that satisfies a passenger request, with match metrics."""

    offer: RideOfferRecord
    pickup_distance_kilometers: float
    drop_distance_kilometers: float
    fare_amount: float


@dataclass
class MatchedRequest:
    """A request that fits a driver offer, with match metrics."""

    request: RideRequestRecord
    pickup_distance_kilometers: float
    drop_distance_kilometers: float
    fare_amount: float


def _is_departure_time_within_window(
    *, departure_time: str, window_start_time: str, window_end_time: str
) -> bool:
    """Return whether an "HH:MM" time falls within an inclusive window."""
    return window_start_time <= departure_time <= window_end_time


def _endpoints_are_within_radii(
    *,
    request: RideRequestRecord,
    offer: RideOfferRecord,
    pickup_match_radius_kilometers: float,
    drop_match_radius_kilometers: float,
) -> tuple[bool, float, float]:
    """Return whether pickup and drop are close enough, with the distances."""
    pickup_distance = calculate_straight_line_distance_kilometers(
        first_latitude=request.source_latitude,
        first_longitude=request.source_longitude,
        second_latitude=offer.source_latitude,
        second_longitude=offer.source_longitude,
    )
    drop_distance = calculate_straight_line_distance_kilometers(
        first_latitude=request.destination_latitude,
        first_longitude=request.destination_longitude,
        second_latitude=offer.destination_latitude,
        second_longitude=offer.destination_longitude,
    )
    is_within = (
        pickup_distance <= pickup_match_radius_kilometers
        and drop_distance <= drop_match_radius_kilometers
    )
    return is_within, round(pickup_distance, 2), round(drop_distance, 2)


def find_offers_matching_request(
    *,
    database_session: Session,
    ride_request: RideRequestRecord,
    pickup_match_radius_kilometers: float,
    drop_match_radius_kilometers: float,
) -> list[MatchedOffer]:
    """Return open offers that can serve a passenger's request."""
    candidate_offers = list_open_ride_offers_for_date(
        database_session=database_session,
        organization_id=ride_request.organization_id,
        travel_date=ride_request.travel_date,
        minimum_seats_available=ride_request.seats_requested,
        excluded_driver_employee_id=ride_request.passenger_employee_id,
    )

    matched_offers: list[MatchedOffer] = []
    for offer in candidate_offers:
        if not _is_departure_time_within_window(
            departure_time=ride_request.departure_time,
            window_start_time=offer.departure_window_start_time,
            window_end_time=offer.departure_window_end_time,
        ):
            continue
        is_within, pickup_distance, drop_distance = _endpoints_are_within_radii(
            request=ride_request,
            offer=offer,
            pickup_match_radius_kilometers=pickup_match_radius_kilometers,
            drop_match_radius_kilometers=drop_match_radius_kilometers,
        )
        if not is_within:
            continue
        matched_offers.append(
            MatchedOffer(
                offer=offer,
                pickup_distance_kilometers=pickup_distance,
                drop_distance_kilometers=drop_distance,
                fare_amount=ride_request.estimated_fare_amount or 0.0,
            )
        )

    matched_offers.sort(key=lambda matched: matched.pickup_distance_kilometers)
    return matched_offers


def find_requests_matching_offer(
    *,
    database_session: Session,
    ride_offer: RideOfferRecord,
    pickup_match_radius_kilometers: float,
    drop_match_radius_kilometers: float,
) -> list[MatchedRequest]:
    """Return pending requests that fit a driver's offer.

    Only requests whose seat count does not exceed the offer's remaining
    seats are returned, so a driver never sees a request they cannot take.
    """
    candidate_requests = list_pending_ride_requests_for_date(
        database_session=database_session,
        organization_id=ride_offer.organization_id,
        travel_date=ride_offer.travel_date,
        excluded_passenger_employee_id=ride_offer.driver_employee_id,
    )

    matched_requests: list[MatchedRequest] = []
    for request in candidate_requests:
        if request.seats_requested > ride_offer.seats_available:
            continue
        if not _is_departure_time_within_window(
            departure_time=request.departure_time,
            window_start_time=ride_offer.departure_window_start_time,
            window_end_time=ride_offer.departure_window_end_time,
        ):
            continue
        is_within, pickup_distance, drop_distance = _endpoints_are_within_radii(
            request=request,
            offer=ride_offer,
            pickup_match_radius_kilometers=pickup_match_radius_kilometers,
            drop_match_radius_kilometers=drop_match_radius_kilometers,
        )
        if not is_within:
            continue
        matched_requests.append(
            MatchedRequest(
                request=request,
                pickup_distance_kilometers=pickup_distance,
                drop_distance_kilometers=drop_distance,
                fare_amount=request.estimated_fare_amount or 0.0,
            )
        )

    matched_requests.sort(key=lambda matched: matched.pickup_distance_kilometers)
    return matched_requests
