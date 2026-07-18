"""Unit checks for the pure payment-gateway math and wallet ledger logic.

These avoid the network and any real database: the Razorpay adapter is
exercised only through its deterministic rupee-to-paise and HMAC signature
helpers, and the wallet ledger runs against an in-memory SQLite session.
"""

import hashlib
import hmac

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)
from source.modules.payment_gateway.razorpay_gateway_service import (
    RazorpayGatewayService,
)
from source.shared_infrastructure.base_database_model import BaseDatabaseModel

# Import model modules so their tables register on the shared metadata.
from source.modules.organization_management.organization_record_model import (  # noqa: F401
    OrganizationRecord,
)
from source.modules.employee_management.employee_record_model import (  # noqa: F401
    EmployeeRecord,
)
from source.modules.administrator_authentication.user_account_record_model import (  # noqa: F401
    UserAccountRecord,
)
from source.modules.wallet.wallet_record_model import WalletRecord  # noqa: F401
from source.modules.wallet.wallet_transaction_record_model import (  # noqa: F401
    WalletTransactionRecord,
)
from source.modules.wallet.wallet_service import (
    InsufficientWalletBalanceError,
    credit_wallet_for_ride_earning,
    debit_wallet_for_ride_payment,
    retrieve_or_create_wallet,
)

_ORGANIZATION_ID = "org-test"
_DRIVER_ID = "driver-1"
_PASSENGER_ID = "passenger-1"


@pytest.fixture()
def database_session():
    """Yield a session backed by a fresh in-memory SQLite database."""
    engine = create_engine("sqlite:///:memory:")
    BaseDatabaseModel.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


def _gateway_with_secret(secret: str) -> RazorpayGatewayService:
    # Init values win over any .env; the field uses the RAZORPAY_KEY_SECRET alias.
    return RazorpayGatewayService(
        ApplicationConfiguration(RAZORPAY_KEY_SECRET=secret)
    )


def test_convert_rupees_to_paise_rounds_half_up():
    gateway = _gateway_with_secret("secret")
    assert gateway.convert_rupees_to_paise(100.0) == 10000
    assert gateway.convert_rupees_to_paise(99.99) == 9999
    assert gateway.convert_rupees_to_paise(0.005) == 1


def test_verify_checkout_signature_accepts_only_matching_hmac():
    gateway = _gateway_with_secret("testsecret")
    order_id, payment_id = "order_abc", "pay_xyz"
    valid_signature = hmac.new(
        b"testsecret",
        f"{order_id}|{payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    assert gateway.verify_checkout_signature(
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        submitted_signature=valid_signature,
    )
    assert not gateway.verify_checkout_signature(
        razorpay_order_id=order_id,
        razorpay_payment_id=payment_id,
        submitted_signature="tampered",
    )


def test_credit_then_debit_updates_balance_and_ledger(database_session):
    earning = credit_wallet_for_ride_earning(
        database_session,
        organization_id=_ORGANIZATION_ID,
        payee_employee_id=_DRIVER_ID,
        amount=150.0,
        ride_booking_id="booking-1",
    )
    assert earning.direction == "CREDIT"
    assert earning.balance_after == 150.0

    driver_wallet = retrieve_or_create_wallet(
        database_session,
        organization_id=_ORGANIZATION_ID,
        employee_id=_DRIVER_ID,
    )
    assert driver_wallet.balance_amount == 150.0

    payment = debit_wallet_for_ride_payment(
        database_session,
        organization_id=_ORGANIZATION_ID,
        payer_employee_id=_DRIVER_ID,
        amount=50.0,
        ride_booking_id="booking-2",
    )
    assert payment.direction == "DEBIT"
    assert payment.balance_after == 100.0


def test_debit_beyond_balance_raises(database_session):
    with pytest.raises(InsufficientWalletBalanceError):
        debit_wallet_for_ride_payment(
            database_session,
            organization_id=_ORGANIZATION_ID,
            payer_employee_id=_PASSENGER_ID,
            amount=25.0,
            ride_booking_id="booking-3",
        )
