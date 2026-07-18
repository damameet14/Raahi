"""Unit checks for the pre-ride reminder windowing and once-only flag.

Runs against in-memory SQLite with no bookings, so the sweep exercises the
15-minute window selection and the ``reminder_sent`` dedupe without needing
real notification delivery.
"""

from datetime import date, datetime, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)
from source.shared_infrastructure.base_database_model import BaseDatabaseModel

# Register the tables the sweep touches.
from source.modules.organization_management.organization_record_model import (  # noqa: F401
    OrganizationRecord,
)
from source.modules.employee_management.employee_record_model import (  # noqa: F401
    EmployeeRecord,
)
from source.modules.vehicle_management.vehicle_record_model import (  # noqa: F401
    VehicleRecord,
)
from source.modules.ride_coordination.ride_offer_record_model import (
    RideOfferRecord,
)
from source.modules.ride_coordination.ride_booking_record_model import (  # noqa: F401
    RideBookingRecord,
)
from source.modules.ride_coordination.ride_request_record_model import (  # noqa: F401
    RideRequestRecord,
)
from source.modules.ride_coordination.ride_reminder_service import (
    send_due_ride_reminders,
)


@pytest.fixture()
def database_session():
    engine = create_engine("sqlite:///:memory:")
    BaseDatabaseModel.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def _add_offer(session, *, travel_date, departure_time: str) -> RideOfferRecord:
    offer = RideOfferRecord(
        organization_id="org-1",
        driver_employee_id="driver-1",
        vehicle_id="vehicle-1",
        source_latitude=0.0,
        source_longitude=0.0,
        destination_latitude=1.0,
        destination_longitude=1.0,
        travel_date=travel_date,
        departure_window_start_time=departure_time,
        departure_window_end_time=departure_time,
        seats_total=3,
        seats_available=3,
        journey_status="OPEN",
    )
    session.add(offer)
    session.commit()
    session.refresh(offer)
    return offer


def test_only_offers_within_the_window_are_flagged(database_session):
    now = datetime(2026, 7, 18, 9, 0, 0)
    _add_offer(database_session, travel_date=date(2026, 7, 18), departure_time="09:10")
    _add_offer(database_session, travel_date=date(2026, 7, 18), departure_time="09:40")

    reminded = send_due_ride_reminders(
        database_session=database_session,
        configuration=ApplicationConfiguration(),
        current_time=now,
    )

    # The 09:10 offer is within 15 minutes; the 09:40 offer is not.
    assert reminded == 1
    flagged = [
        offer.reminder_sent
        for offer in database_session.query(RideOfferRecord).all()
    ]
    assert sorted(flagged) == [False, True]


def test_reminder_is_sent_only_once(database_session):
    now = datetime(2026, 7, 18, 9, 0, 0)
    _add_offer(database_session, travel_date=date(2026, 7, 18), departure_time="09:10")

    first_pass = send_due_ride_reminders(
        database_session=database_session,
        configuration=ApplicationConfiguration(),
        current_time=now,
    )
    second_pass = send_due_ride_reminders(
        database_session=database_session,
        configuration=ApplicationConfiguration(),
        current_time=now,
    )

    assert first_pass == 1
    assert second_pass == 0
