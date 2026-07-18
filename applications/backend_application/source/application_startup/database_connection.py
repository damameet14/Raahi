"""SQLAlchemy database engine and session management."""

from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator, Iterator

from source.application_startup.application_configuration import ApplicationConfiguration


def create_database_engine(configuration: ApplicationConfiguration):
    """Create a SQLAlchemy engine from the application configuration."""
    return create_engine(
        configuration.database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False,
    )


def create_database_session_factory(engine) -> sessionmaker:
    """Create a session factory bound to the given engine."""
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Module-level singletons (initialized in main.py) ────────
_engine = None
_session_factory = None


def initialize_database(configuration: ApplicationConfiguration):
    """Initialize the database engine and session factory.

    Called once during application startup.
    """
    global _engine, _session_factory
    _engine = create_database_engine(configuration)
    _session_factory = create_database_session_factory(_engine)
    return _engine


def get_database_session() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session per request.

    The session is automatically closed after the request completes.
    """
    if _session_factory is None:
        raise RuntimeError(
            "Database not initialized. Call initialize_database() during startup."
        )
    session = _session_factory()
    try:
        yield session
    finally:
        session.close()


@contextmanager
def open_database_session() -> Iterator[Session]:
    """Yield a standalone session for non-request contexts.

    WebSocket handlers and background jobs (e.g. the ride-reminder scheduler)
    have no request lifecycle, so they open and close their own short-lived
    session through this context manager instead of the FastAPI dependency.
    """
    if _session_factory is None:
        raise RuntimeError(
            "Database not initialized. Call initialize_database() during startup."
        )
    session = _session_factory()
    try:
        yield session
    finally:
        session.close()
