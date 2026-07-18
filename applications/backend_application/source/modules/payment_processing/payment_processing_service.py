"""Business workflow for settling ride-booking fares.

The passenger on a completed booking is the payer; the driver is the payee.
Every successful payment marks the booking PAID and credits the fare into the
driver's wallet. Wallet payments additionally debit the passenger's balance.
Card and UPI settle through Razorpay (order then verified signature); cash and
wallet settle directly. All balance moves and the payment record commit together.
"""

import json
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)
from source.modules.employee_management.employee_record_model import EmployeeRecord
from source.modules.payment_gateway.public_interface import RazorpayGatewayService
from source.modules.payment_processing.payment_processing_contracts import (
    CreateRazorpayOrderRequest,
    PaymentResponse,
    RazorpayOrderResponse,
    RazorpayWebhookProcessingResponse,
    VerifyRazorpayPaymentRequest,
)
from source.modules.payment_processing.payment_record_model import PaymentRecord
from source.modules.ride_coordination.ride_booking_record_model import (
    RideBookingRecord,
)
from source.modules.ride_coordination.ride_status_definitions import (
    RideBookingTripStatus,
)
from source.modules.wallet.public_interface import (
    InsufficientWalletBalanceError,
    credit_wallet_for_ride_earning,
    debit_wallet_for_ride_payment,
)

_RIDE_BOOKING_ACTIVITY_TYPE = "ride_booking"
_RAZORPAY_CAPTURED_EVENTS = {"payment.captured", "order.paid"}


class RideBookingNotPayableError(Exception):
    """Raised when a booking cannot currently be paid (state or ownership)."""

    def __init__(self, http_status_code: int, detail: str):
        self.http_status_code = http_status_code
        self.detail = detail
        super().__init__(detail)


class PaymentProcessingService:
    """Coordinates payment records, Razorpay, bookings, and wallet transfers."""

    def __init__(self, configuration: ApplicationConfiguration):
        self.configuration = configuration
        self.razorpay_gateway_service = RazorpayGatewayService(configuration)

    # ── Card / UPI via Razorpay ──────────────────────────────
    async def create_razorpay_order_for_booking(
        self,
        database_session: Session,
        employee: EmployeeRecord,
        request: CreateRazorpayOrderRequest,
    ) -> RazorpayOrderResponse:
        """Open (or reuse) a Razorpay order for a completed booking's fare."""
        booking = self._resolve_payable_booking(
            database_session,
            employee=employee,
            ride_booking_id=request.ride_booking_id,
        )
        payment = self._get_or_create_payment(
            database_session,
            booking=booking,
            method=request.method,
        )
        razorpay_order = await self.razorpay_gateway_service.create_order(
            amount_in_rupees=payment.amount,
            currency=payment.currency,
            receipt_reference=payment.id,
        )
        payment.razorpay_order_id = razorpay_order["id"]
        payment.status = "CREATED"
        database_session.commit()
        database_session.refresh(payment)

        return RazorpayOrderResponse(
            payment_id=payment.id,
            ride_booking_id=payment.activity_id,
            razorpay_order_id=payment.razorpay_order_id,
            razorpay_key_id=self.configuration.razorpay_key_id,
            amount=self.razorpay_gateway_service.convert_rupees_to_paise(
                payment.amount
            ),
            currency=payment.currency,
            company_name=self.configuration.razorpay_company_name,
            description=self.configuration.razorpay_company_description,
            theme_color=self.configuration.razorpay_theme_color,
        )

    async def verify_razorpay_payment(
        self,
        database_session: Session,
        employee: EmployeeRecord,
        request: VerifyRazorpayPaymentRequest,
    ) -> PaymentResponse:
        """Verify a Checkout signature and settle the fare idempotently."""
        payment = (
            database_session.query(PaymentRecord)
            .filter(
                PaymentRecord.razorpay_order_id == request.razorpay_order_id,
                PaymentRecord.organization_id == employee.organization_id,
            )
            .first()
        )
        if payment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found"
            )
        if payment.payer_employee_id != employee.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This payment belongs to another employee",
            )
        if payment.status == "COMPLETED":
            return self._build_payment_response(payment)

        is_signature_valid = (
            self.razorpay_gateway_service.verify_checkout_signature(
                razorpay_order_id=request.razorpay_order_id,
                razorpay_payment_id=request.razorpay_payment_id,
                submitted_signature=request.razorpay_signature,
            )
        )
        if not is_signature_valid:
            payment.status = "FAILED"
            payment.failure_reason = "Invalid Razorpay payment signature"
            database_session.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Razorpay payment signature",
            )

        booking = self._load_booking_for_payment(database_session, payment)
        payment.razorpay_payment_id = request.razorpay_payment_id
        payment.razorpay_signature_reference = request.razorpay_signature[-12:]
        payment.failure_reason = None
        self._settle_payment(
            database_session,
            payment=payment,
            booking=booking,
            should_debit_payer_wallet=False,
        )
        database_session.commit()
        database_session.refresh(payment)
        return self._build_payment_response(payment)

    # ── Cash / Wallet direct settlement ──────────────────────
    def pay_booking_directly(
        self,
        database_session: Session,
        employee: EmployeeRecord,
        ride_booking_id: str,
        method: str,
    ) -> PaymentResponse:
        """Settle a completed booking's fare immediately by cash or wallet."""
        booking = self._resolve_payable_booking(
            database_session,
            employee=employee,
            ride_booking_id=ride_booking_id,
        )
        payment = self._get_or_create_payment(
            database_session, booking=booking, method=method
        )
        self._settle_payment(
            database_session,
            payment=payment,
            booking=booking,
            should_debit_payer_wallet=(method == "WALLET"),
        )
        database_session.commit()
        database_session.refresh(payment)
        return self._build_payment_response(payment)

    # ── Reads ────────────────────────────────────────────────
    def get_payment_status(
        self,
        database_session: Session,
        employee: EmployeeRecord,
        payment_id: str,
    ) -> PaymentResponse:
        """Return one payment if the caller is its payer or payee."""
        payment = (
            database_session.query(PaymentRecord)
            .filter(
                PaymentRecord.id == payment_id,
                PaymentRecord.organization_id == employee.organization_id,
            )
            .first()
        )
        if payment is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found"
            )
        if employee.id not in {
            payment.payer_employee_id,
            payment.payee_employee_id,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Payment access denied",
            )
        return self._build_payment_response(payment)

    def list_my_payments(
        self,
        database_session: Session,
        employee: EmployeeRecord,
    ) -> list[PaymentResponse]:
        """Return payments the employee paid or earned, most recent first."""
        payments = (
            database_session.query(PaymentRecord)
            .filter(
                PaymentRecord.organization_id == employee.organization_id,
                (PaymentRecord.payer_employee_id == employee.id)
                | (PaymentRecord.payee_employee_id == employee.id),
            )
            .order_by(PaymentRecord.created_at.desc())
            .all()
        )
        return [self._build_payment_response(payment) for payment in payments]

    # ── Webhook ──────────────────────────────────────────────
    async def process_razorpay_webhook(
        self,
        database_session: Session,
        raw_request_body: bytes,
        submitted_signature: str | None,
    ) -> RazorpayWebhookProcessingResponse:
        """Process a verified Razorpay webhook event idempotently."""
        is_signature_valid = (
            self.razorpay_gateway_service.verify_webhook_signature(
                raw_request_body=raw_request_body,
                submitted_signature=submitted_signature,
            )
        )
        if not is_signature_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Razorpay webhook signature",
            )

        event_payload = json.loads(raw_request_body.decode("utf-8"))
        event_name = event_payload.get("event", "")
        payment_entity = (
            event_payload.get("payload", {})
            .get("payment", {})
            .get("entity", {})
        )
        razorpay_order_id = payment_entity.get("order_id")
        if not razorpay_order_id:
            return RazorpayWebhookProcessingResponse(
                processed=False, message="Webhook has no order id"
            )

        payment = (
            database_session.query(PaymentRecord)
            .filter(PaymentRecord.razorpay_order_id == razorpay_order_id)
            .first()
        )
        if payment is None:
            return RazorpayWebhookProcessingResponse(
                processed=False, message="Payment record not found"
            )
        if payment.status == "COMPLETED":
            return RazorpayWebhookProcessingResponse(
                processed=True, message="Payment already completed"
            )

        if event_name in _RAZORPAY_CAPTURED_EVENTS:
            booking = self._load_booking_for_payment(database_session, payment)
            payment.razorpay_payment_id = payment_entity.get("id")
            payment.failure_reason = None
            self._settle_payment(
                database_session,
                payment=payment,
                booking=booking,
                should_debit_payer_wallet=False,
            )
            database_session.commit()
            return RazorpayWebhookProcessingResponse(
                processed=True, message="Payment completed from webhook"
            )
        if event_name == "payment.failed":
            payment.status = "FAILED"
            payment.failure_reason = "Razorpay reported payment failure"
            database_session.commit()
            return RazorpayWebhookProcessingResponse(
                processed=True, message="Payment failure webhook recorded"
            )

        return RazorpayWebhookProcessingResponse(
            processed=False, message="Webhook event ignored"
        )

    # ── Internal helpers ─────────────────────────────────────
    def _resolve_payable_booking(
        self,
        database_session: Session,
        *,
        employee: EmployeeRecord,
        ride_booking_id: str,
    ) -> RideBookingRecord:
        """Load a booking the given employee may pay, or raise."""
        booking = (
            database_session.query(RideBookingRecord)
            .filter(
                RideBookingRecord.id == ride_booking_id,
                RideBookingRecord.organization_id == employee.organization_id,
            )
            .first()
        )
        if booking is None:
            raise RideBookingNotPayableError(
                status.HTTP_404_NOT_FOUND, "Booking not found"
            )
        if booking.passenger_employee_id != employee.id:
            raise RideBookingNotPayableError(
                status.HTTP_403_FORBIDDEN,
                "Only the passenger can pay for this booking",
            )
        if booking.trip_status != RideBookingTripStatus.COMPLETED.value:
            raise RideBookingNotPayableError(
                status.HTTP_409_CONFLICT, "The ride is not completed yet"
            )
        if booking.payment_status == "PAID":
            raise RideBookingNotPayableError(
                status.HTTP_409_CONFLICT, "This booking is already paid"
            )
        if booking.fare_amount <= 0:
            raise RideBookingNotPayableError(
                status.HTTP_409_CONFLICT, "This booking has no payable fare"
            )
        return booking

    def _get_or_create_payment(
        self,
        database_session: Session,
        *,
        booking: RideBookingRecord,
        method: str,
    ) -> PaymentRecord:
        """Return the booking's payment, creating a pending one if needed."""
        payment = (
            database_session.query(PaymentRecord)
            .filter(
                PaymentRecord.organization_id == booking.organization_id,
                PaymentRecord.activity_id == booking.id,
                PaymentRecord.activity_type == _RIDE_BOOKING_ACTIVITY_TYPE,
            )
            .first()
        )
        if payment is not None:
            if payment.status == "COMPLETED":
                raise RideBookingNotPayableError(
                    status.HTTP_409_CONFLICT,
                    "This booking is already paid",
                )
            payment.method = method
            database_session.flush()
            return payment

        payment = PaymentRecord(
            organization_id=booking.organization_id,
            activity_type=_RIDE_BOOKING_ACTIVITY_TYPE,
            activity_id=booking.id,
            payer_employee_id=booking.passenger_employee_id,
            payee_employee_id=booking.driver_employee_id,
            method=method,
            amount=booking.fare_amount,
            currency=self.configuration.razorpay_currency,
            status="PENDING",
        )
        database_session.add(payment)
        database_session.flush()
        return payment

    def _settle_payment(
        self,
        database_session: Session,
        *,
        payment: PaymentRecord,
        booking: RideBookingRecord,
        should_debit_payer_wallet: bool,
    ) -> None:
        """Move the fare and mark the payment and booking as settled.

        Debits the passenger's wallet first when paying by wallet (may raise
        :class:`InsufficientWalletBalanceError`), then always credits the
        driver's wallet with the fare. Does not commit; the caller does.
        """
        if should_debit_payer_wallet:
            debit_wallet_for_ride_payment(
                database_session,
                organization_id=payment.organization_id,
                payer_employee_id=payment.payer_employee_id,
                amount=payment.amount,
                ride_booking_id=booking.id,
            )
        credit_wallet_for_ride_earning(
            database_session,
            organization_id=payment.organization_id,
            payee_employee_id=payment.payee_employee_id,
            amount=payment.amount,
            ride_booking_id=booking.id,
        )
        booking.payment_status = "PAID"
        payment.status = "COMPLETED"
        payment.paid_at = datetime.now(timezone.utc)

    def _load_booking_for_payment(
        self, database_session: Session, payment: PaymentRecord
    ) -> RideBookingRecord:
        """Load the booking a payment settles, raising if it vanished."""
        booking = database_session.get(RideBookingRecord, payment.activity_id)
        if booking is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking for this payment no longer exists",
            )
        return booking

    def _build_payment_response(
        self, payment: PaymentRecord
    ) -> PaymentResponse:
        """Convert a database record into the public API contract."""
        return PaymentResponse(
            id=payment.id,
            ride_booking_id=payment.activity_id,
            payer_employee_id=payment.payer_employee_id,
            payee_employee_id=payment.payee_employee_id,
            method=payment.method,
            amount=payment.amount,
            currency=payment.currency,
            status=payment.status,
            razorpay_order_id=payment.razorpay_order_id,
            razorpay_payment_id=payment.razorpay_payment_id,
            failure_reason=payment.failure_reason,
            created_at=payment.created_at,
            updated_at=payment.updated_at,
            paid_at=payment.paid_at,
        )
