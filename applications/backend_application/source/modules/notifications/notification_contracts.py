"""Neutral input contracts for notification dispatch.

These shapes intentionally carry only plain values (names, phones, labels,
amounts) so the notifications module never imports the ride or payment domains
and no dependency cycle forms — the domains fill these contracts and call in.
"""

from pydantic import BaseModel


class RideNotificationDetails(BaseModel):
    """Everything a ride-lifecycle message needs about one booking."""

    driver_full_name: str
    driver_phone: str | None
    passenger_full_name: str
    passenger_phone: str | None
    travel_date: str
    departure_time: str
    pickup_label: str | None
    drop_label: str | None
    vehicle_description: str
    fare_amount: float


class PaymentNotificationDetails(BaseModel):
    """Everything a payment message/email needs about one fare payment."""

    payer_full_name: str
    payer_email: str | None
    payer_phone: str | None
    amount: float
    currency: str
    method: str
    route_summary: str
