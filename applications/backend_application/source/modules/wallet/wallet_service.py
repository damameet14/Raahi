"""Business workflow for wallet balances, the ledger, and Razorpay recharge.

Balance mutations happen only through :func:`credit_wallet_balance` and
:func:`debit_wallet_balance`, which append a matching ledger entry. Fare-related
helpers used by ``payment_processing`` flush within the caller's transaction so
a fare transfer commits atomically with the payment record; recharge workflows
own their own commit.
"""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)
from source.modules.payment_gateway.public_interface import RazorpayGatewayService
from source.modules.wallet.wallet_contracts import (
    CreateWalletRechargeOrderRequest,
    VerifyWalletRechargeRequest,
    WalletBalanceResponse,
    WalletRechargeOrderResponse,
    WalletTransactionResponse,
)
from source.modules.wallet.wallet_record_model import WalletRecord
from source.modules.wallet.wallet_transaction_record_model import (
    WalletTransactionRecord,
)

_RIDE_BOOKING_REFERENCE_TYPE = "ride_booking"
_RECHARGE_REFERENCE_TYPE = "razorpay_recharge"


class InsufficientWalletBalanceError(Exception):
    """Raised when a debit exceeds the available wallet balance."""


class WalletRechargeNotFoundError(Exception):
    """Raised when a recharge cannot be matched to a pending ledger entry."""


def retrieve_or_create_wallet(
    database_session: Session,
    *,
    organization_id: str,
    employee_id: str,
) -> WalletRecord:
    """Return the employee's wallet, creating an empty one on first use."""
    wallet = (
        database_session.query(WalletRecord)
        .filter(
            WalletRecord.organization_id == organization_id,
            WalletRecord.employee_id == employee_id,
        )
        .first()
    )
    if wallet is None:
        wallet = WalletRecord(
            organization_id=organization_id,
            employee_id=employee_id,
            balance_amount=0.0,
        )
        database_session.add(wallet)
        database_session.flush()
    return wallet


def credit_wallet_balance(
    database_session: Session,
    *,
    organization_id: str,
    employee_id: str,
    amount: float,
    transaction_type: str,
    reference_type: str | None = None,
    reference_id: str | None = None,
    description: str | None = None,
) -> WalletTransactionRecord:
    """Increase a wallet balance and append a completed credit ledger entry.

    Flushes but does not commit; the caller owns the transaction boundary.
    """
    wallet = retrieve_or_create_wallet(
        database_session,
        organization_id=organization_id,
        employee_id=employee_id,
    )
    wallet.balance_amount += amount
    transaction = WalletTransactionRecord(
        organization_id=organization_id,
        wallet_id=wallet.id,
        employee_id=employee_id,
        transaction_type=transaction_type,
        direction="CREDIT",
        amount=amount,
        balance_after=wallet.balance_amount,
        status="COMPLETED",
        completed_at=datetime.now(timezone.utc),
        reference_type=reference_type,
        reference_id=reference_id,
        description=description,
    )
    database_session.add(transaction)
    database_session.flush()
    return transaction


def debit_wallet_balance(
    database_session: Session,
    *,
    organization_id: str,
    employee_id: str,
    amount: float,
    transaction_type: str,
    reference_type: str | None = None,
    reference_id: str | None = None,
    description: str | None = None,
) -> WalletTransactionRecord:
    """Decrease a wallet balance and append a completed debit ledger entry.

    Raises :class:`InsufficientWalletBalanceError` if the balance is too low.
    Flushes but does not commit; the caller owns the transaction boundary.
    """
    wallet = retrieve_or_create_wallet(
        database_session,
        organization_id=organization_id,
        employee_id=employee_id,
    )
    if wallet.balance_amount < amount:
        raise InsufficientWalletBalanceError(employee_id)
    wallet.balance_amount -= amount
    transaction = WalletTransactionRecord(
        organization_id=organization_id,
        wallet_id=wallet.id,
        employee_id=employee_id,
        transaction_type=transaction_type,
        direction="DEBIT",
        amount=amount,
        balance_after=wallet.balance_amount,
        status="COMPLETED",
        completed_at=datetime.now(timezone.utc),
        reference_type=reference_type,
        reference_id=reference_id,
        description=description,
    )
    database_session.add(transaction)
    database_session.flush()
    return transaction


def credit_wallet_for_ride_earning(
    database_session: Session,
    *,
    organization_id: str,
    payee_employee_id: str,
    amount: float,
    ride_booking_id: str,
) -> WalletTransactionRecord:
    """Credit a driver's wallet with the fare they earned on a completed ride."""
    return credit_wallet_balance(
        database_session,
        organization_id=organization_id,
        employee_id=payee_employee_id,
        amount=amount,
        transaction_type="RIDE_EARNING",
        reference_type=_RIDE_BOOKING_REFERENCE_TYPE,
        reference_id=ride_booking_id,
        description="Fare earned for a completed ride",
    )


def debit_wallet_for_ride_payment(
    database_session: Session,
    *,
    organization_id: str,
    payer_employee_id: str,
    amount: float,
    ride_booking_id: str,
) -> WalletTransactionRecord:
    """Debit a passenger's wallet to pay a completed ride fare.

    Raises :class:`InsufficientWalletBalanceError` when the balance is too low.
    """
    return debit_wallet_balance(
        database_session,
        organization_id=organization_id,
        employee_id=payer_employee_id,
        amount=amount,
        transaction_type="RIDE_PAYMENT",
        reference_type=_RIDE_BOOKING_REFERENCE_TYPE,
        reference_id=ride_booking_id,
        description="Fare paid for a completed ride",
    )


def get_wallet_balance(
    database_session: Session,
    *,
    organization_id: str,
    employee_id: str,
) -> WalletBalanceResponse:
    """Return the current spendable balance for an employee."""
    wallet = retrieve_or_create_wallet(
        database_session,
        organization_id=organization_id,
        employee_id=employee_id,
    )
    database_session.commit()
    return WalletBalanceResponse(
        employee_id=employee_id,
        balance_amount=wallet.balance_amount,
        currency=wallet.currency,
    )


def list_wallet_transactions(
    database_session: Session,
    *,
    organization_id: str,
    employee_id: str,
) -> list[WalletTransactionResponse]:
    """Return the employee's ledger entries, most recent first."""
    transactions = (
        database_session.query(WalletTransactionRecord)
        .filter(
            WalletTransactionRecord.organization_id == organization_id,
            WalletTransactionRecord.employee_id == employee_id,
        )
        .order_by(WalletTransactionRecord.created_at.desc())
        .all()
    )
    return [
        _build_transaction_response(transaction) for transaction in transactions
    ]


async def create_wallet_recharge_order(
    database_session: Session,
    razorpay_gateway_service: RazorpayGatewayService,
    configuration: ApplicationConfiguration,
    *,
    organization_id: str,
    employee_id: str,
    request: CreateWalletRechargeOrderRequest,
) -> WalletRechargeOrderResponse:
    """Create a Razorpay order and a pending recharge ledger entry."""
    wallet = retrieve_or_create_wallet(
        database_session,
        organization_id=organization_id,
        employee_id=employee_id,
    )
    razorpay_order = await razorpay_gateway_service.create_order(
        amount_in_rupees=request.amount,
        currency=wallet.currency,
        receipt_reference=f"wallet-{wallet.id}",
    )
    pending_transaction = WalletTransactionRecord(
        organization_id=organization_id,
        wallet_id=wallet.id,
        employee_id=employee_id,
        transaction_type="RECHARGE",
        direction="CREDIT",
        amount=request.amount,
        balance_after=None,
        status="PENDING",
        reference_type=_RECHARGE_REFERENCE_TYPE,
        reference_id=razorpay_order["id"],
        description="Wallet top-up via Razorpay",
        razorpay_order_id=razorpay_order["id"],
    )
    database_session.add(pending_transaction)
    database_session.commit()
    database_session.refresh(pending_transaction)

    return WalletRechargeOrderResponse(
        transaction_id=pending_transaction.id,
        razorpay_order_id=razorpay_order["id"],
        razorpay_key_id=configuration.razorpay_key_id,
        amount=razorpay_gateway_service.convert_rupees_to_paise(request.amount),
        currency=wallet.currency,
        company_name=configuration.razorpay_company_name,
        description=f"{configuration.razorpay_company_name} wallet top-up",
        theme_color=configuration.razorpay_theme_color,
    )


def verify_wallet_recharge(
    database_session: Session,
    razorpay_gateway_service: RazorpayGatewayService,
    *,
    organization_id: str,
    employee_id: str,
    request: VerifyWalletRechargeRequest,
) -> WalletBalanceResponse:
    """Verify a recharge signature and credit the wallet idempotently."""
    pending_transaction = (
        database_session.query(WalletTransactionRecord)
        .filter(
            WalletTransactionRecord.organization_id == organization_id,
            WalletTransactionRecord.employee_id == employee_id,
            WalletTransactionRecord.razorpay_order_id == request.razorpay_order_id,
            WalletTransactionRecord.transaction_type == "RECHARGE",
        )
        .first()
    )
    if pending_transaction is None:
        raise WalletRechargeNotFoundError(request.razorpay_order_id)

    wallet = retrieve_or_create_wallet(
        database_session,
        organization_id=organization_id,
        employee_id=employee_id,
    )
    if pending_transaction.status == "COMPLETED":
        return WalletBalanceResponse(
            employee_id=employee_id,
            balance_amount=wallet.balance_amount,
            currency=wallet.currency,
        )

    is_signature_valid = razorpay_gateway_service.verify_checkout_signature(
        razorpay_order_id=request.razorpay_order_id,
        razorpay_payment_id=request.razorpay_payment_id,
        submitted_signature=request.razorpay_signature,
    )
    if not is_signature_valid:
        pending_transaction.status = "FAILED"
        database_session.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay payment signature",
        )

    wallet.balance_amount += pending_transaction.amount
    pending_transaction.status = "COMPLETED"
    pending_transaction.balance_after = wallet.balance_amount
    pending_transaction.razorpay_payment_id = request.razorpay_payment_id
    pending_transaction.completed_at = datetime.now(timezone.utc)
    database_session.commit()

    return WalletBalanceResponse(
        employee_id=employee_id,
        balance_amount=wallet.balance_amount,
        currency=wallet.currency,
    )


def _build_transaction_response(
    transaction: WalletTransactionRecord,
) -> WalletTransactionResponse:
    """Convert a ledger record into its public API contract."""
    return WalletTransactionResponse(
        id=transaction.id,
        transaction_type=transaction.transaction_type,
        direction=transaction.direction,
        amount=transaction.amount,
        balance_after=transaction.balance_after,
        status=transaction.status,
        reference_type=transaction.reference_type,
        reference_id=transaction.reference_id,
        description=transaction.description,
        created_at=transaction.created_at,
    )
