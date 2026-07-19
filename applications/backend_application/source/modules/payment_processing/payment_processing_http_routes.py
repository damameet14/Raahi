"""FastAPI routes for ride-booking fare payments."""

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)
from source.application_startup.database_connection import get_database_session
from source.modules.employee_management.employee_record_model import EmployeeRecord
from source.modules.employee_management.current_employee_http_dependency import (
    resolve_current_employee,
)
from source.modules.payment_processing.payment_processing_contracts import (
    CreateRazorpayOrderRequest,
    PayBookingRequest,
    PaymentResponse,
    RazorpayOrderResponse,
    RazorpayWebhookProcessingResponse,
    VerifyRazorpayPaymentRequest,
)
from source.modules.payment_processing.payment_processing_service import (
    PaymentProcessingService,
    RideBookingNotPayableError,
)
from source.modules.wallet.public_interface import (
    InsufficientWalletBalanceError,
)
from source.modules.notifications.public_interface import (
    PaymentNotificationDetails,
    notify_payment_failed,
    notify_payment_succeeded,
)
from source.modules.realtime_events.public_interface import publish_employee_event
from source.shared_infrastructure.application_configuration_dependency import (
    get_application_configuration,
)

import logging

logger = logging.getLogger(__name__)

payment_processing_router = APIRouter(
    prefix="/api/v1/payments",
    tags=["Payment Processing"],
)


def _create_payment_processing_service(
    configuration: ApplicationConfiguration = Depends(
        get_application_configuration
    ),
) -> PaymentProcessingService:
    """FastAPI dependency constructing the payment service per request."""
    return PaymentProcessingService(configuration)


def _notify_payment_result(
    *,
    configuration: ApplicationConfiguration,
    employee: EmployeeRecord,
    payment: PaymentResponse,
    did_succeed: bool,
) -> None:
    """Best-effort payment email/WhatsApp; never breaks the response."""
    details = PaymentNotificationDetails(
        payer_full_name=employee.full_name,
        payer_email=employee.email,
        payer_phone=employee.phone,
        amount=payment.amount,
        currency=payment.currency,
        method=payment.method,
        route_summary=f"your completed Raahi ride (booking {payment.ride_booking_id[:8]})",
    )
    try:
        if did_succeed:
            notify_payment_succeeded(
                configuration=configuration, details=details
            )
        else:
            notify_payment_failed(
                configuration=configuration, details=details
            )
    except Exception as notification_error:  # noqa: BLE001 - best-effort
        logger.warning(
            "Payment notification failed safely: %s", notification_error
        )

    # Push a real-time event to the driver who earned the fare.
    if did_succeed and payment.payee_employee_id:
        publish_employee_event(
            [payment.payee_employee_id],
            {
                "type": "payment_received",
                "title": "Payment received",
                "message": f"{employee.full_name} paid ₹{payment.amount:.0f} "
                           "for their ride.",
                "ride_booking_id": payment.ride_booking_id,
                "amount": payment.amount,
            },
        )


@payment_processing_router.post(
    "/razorpay/orders", response_model=RazorpayOrderResponse
)
async def create_razorpay_order(
    request: CreateRazorpayOrderRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
    payment_service: PaymentProcessingService = Depends(
        _create_payment_processing_service
    ),
):
    """Open a Razorpay order for a completed booking's card/UPI payment."""
    try:
        return await payment_service.create_razorpay_order_for_booking(
            database_session=database_session,
            employee=employee,
            request=request,
        )
    except RideBookingNotPayableError as booking_error:
        raise HTTPException(
            status_code=booking_error.http_status_code,
            detail=booking_error.detail,
        )


@payment_processing_router.post(
    "/razorpay/verify", response_model=PaymentResponse
)
async def verify_razorpay_payment(
    request: VerifyRazorpayPaymentRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
    payment_service: PaymentProcessingService = Depends(
        _create_payment_processing_service
    ),
    configuration: ApplicationConfiguration = Depends(
        get_application_configuration
    ),
):
    """Verify a Razorpay Checkout result and settle the fare."""
    payment = await payment_service.verify_razorpay_payment(
        database_session=database_session,
        employee=employee,
        request=request,
    )
    _notify_payment_result(
        configuration=configuration,
        employee=employee,
        payment=payment,
        did_succeed=True,
    )
    return payment


@payment_processing_router.post(
    "/bookings/{ride_booking_id}/pay", response_model=PaymentResponse
)
def pay_booking(
    ride_booking_id: str,
    request: PayBookingRequest,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
    payment_service: PaymentProcessingService = Depends(
        _create_payment_processing_service
    ),
    configuration: ApplicationConfiguration = Depends(
        get_application_configuration
    ),
):
    """Settle a completed booking's fare directly by cash or wallet."""
    try:
        payment = payment_service.pay_booking_directly(
            database_session=database_session,
            employee=employee,
            ride_booking_id=ride_booking_id,
            method=request.method,
        )
        _notify_payment_result(
            configuration=configuration,
            employee=employee,
            payment=payment,
            did_succeed=True,
        )
        return payment
    except RideBookingNotPayableError as booking_error:
        raise HTTPException(
            status_code=booking_error.http_status_code,
            detail=booking_error.detail,
        )
    except InsufficientWalletBalanceError:
        database_session.rollback()
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient wallet balance for this fare",
        )


@payment_processing_router.get(
    "/my-payments", response_model=list[PaymentResponse]
)
def list_my_payments(
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
    payment_service: PaymentProcessingService = Depends(
        _create_payment_processing_service
    ),
):
    """Return payments the authenticated employee paid or earned."""
    return payment_service.list_my_payments(
        database_session=database_session,
        employee=employee,
    )


@payment_processing_router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment_status(
    payment_id: str,
    employee: EmployeeRecord = Depends(resolve_current_employee),
    database_session: Session = Depends(get_database_session),
    payment_service: PaymentProcessingService = Depends(
        _create_payment_processing_service
    ),
):
    """Return one payment to its payer or payee."""
    return payment_service.get_payment_status(
        database_session=database_session,
        employee=employee,
        payment_id=payment_id,
    )


@payment_processing_router.post(
    "/razorpay/webhook", response_model=RazorpayWebhookProcessingResponse
)
async def process_razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None),
    database_session: Session = Depends(get_database_session),
    payment_service: PaymentProcessingService = Depends(
        _create_payment_processing_service
    ),
):
    """Process a signed Razorpay webhook event idempotently."""
    raw_request_body = await request.body()
    return await payment_service.process_razorpay_webhook(
        database_session=database_session,
        raw_request_body=raw_request_body,
        submitted_signature=x_razorpay_signature,
    )
