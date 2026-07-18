"""FastAPI dependency that provides the application configuration.

Routes that need configuration (SMTP, Razorpay, WhatsApp bridge, …) inject
``get_application_configuration`` rather than importing the singleton from the
application entry point, which would create an import cycle. The configuration
is read once from the environment and cached for the process lifetime.
"""

from functools import lru_cache

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
    create_application_configuration,
)


@lru_cache
def get_application_configuration() -> ApplicationConfiguration:
    """Return the process-wide application configuration singleton."""
    return create_application_configuration()
