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
from source.shared_infrastructure.application_configuration_dependency import (
    get_application_configuration,
)

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
):
    """Verify a Razorpay Checkout result and settle the fare."""
    return await payment_service.verify_razorpay_payment(
        database_session=database_session,
        employee=employee,
        request=request,
    )


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
):
    """Settle a completed booking's fare directly by cash or wallet."""
    try:
        return payment_service.pay_booking_directly(
            database_session=database_session,
            employee=employee,
            ride_booking_id=ride_booking_id,
            method=request.method,
        )
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
