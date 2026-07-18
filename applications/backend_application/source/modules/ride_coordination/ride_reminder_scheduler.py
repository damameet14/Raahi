"""In-process APScheduler that runs the pre-ride reminder sweep every minute.

Started during application startup and shut down on exit. Each tick opens its
own short-lived session and calls the reminder sweep; failures are logged and
never crash the scheduler thread.
"""

import logging

from apscheduler.schedulers.background import BackgroundScheduler

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)
from source.application_startup.database_connection import open_database_session
from source.modules.ride_coordination.ride_reminder_service import (
    send_due_ride_reminders,
)

logger = logging.getLogger(__name__)

_REMINDER_SWEEP_INTERVAL_SECONDS = 60


def start_ride_reminder_scheduler(
    configuration: ApplicationConfiguration,
) -> BackgroundScheduler:
    """Start and return the background scheduler running the reminder sweep."""
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        lambda: _run_reminder_sweep(configuration),
        trigger="interval",
        seconds=_REMINDER_SWEEP_INTERVAL_SECONDS,
        id="pre_ride_reminder_sweep",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Ride reminder scheduler started")
    return scheduler


def _run_reminder_sweep(configuration: ApplicationConfiguration) -> None:
    """Run one reminder sweep in its own session, swallowing any error."""
    try:
        with open_database_session() as database_session:
            reminded_count = send_due_ride_reminders(
                database_session=database_session,
                configuration=configuration,
            )
        if reminded_count:
            logger.info("Sent reminders for %s offer(s)", reminded_count)
    except Exception as sweep_error:  # noqa: BLE001 - keep the scheduler alive
        logger.warning("Ride reminder sweep failed safely: %s", sweep_error)
