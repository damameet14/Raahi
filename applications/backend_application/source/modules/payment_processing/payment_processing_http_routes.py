"""FastAPI routes for completed-activity payment processing."""

import json

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from source.application_startup.application_configuration import (
    create_application_configuration,
)
from source.application_startup.database_connection import get_database_session
from source.modules.payment_processing.payment_processing_contracts import (
    CreateRazorpayOrderRequest,
    PaymentStatusResponse,
    RazorpayOrderResponse,
    RazorpayWebhookProcessingResponse,
    VerifyRazorpayPaymentRequest,
)
from source.modules.payment_processing.payment_processing_service import (
    PaymentProcessingService,
)
from source.modules.payment_processing.payment_record_model import PaymentRecord
from source.shared_infrastructure.current_authenticated_user_dependency import (
    AuthenticatedUserContext,
    extract_authenticated_user,
)

payment_processing_router = APIRouter(
    prefix="/api/v1/payments",
    tags=["Payment Processing"],
)


def create_payment_processing_service() -> PaymentProcessingService:
    """Create the payment processing service with current configuration."""
    return PaymentProcessingService(create_application_configuration())


@payment_processing_router.post(
    "/razorpay/orders", response_model=RazorpayOrderResponse
)
async def create_razorpay_order(
    request: CreateRazorpayOrderRequest,
    current_user: AuthenticatedUserContext = Depends(extract_authenticated_user),
    database_session: Session = Depends(get_database_session),
):
    """Create a Razorpay order for an authenticated employee's completed trip."""
    return await create_payment_processing_service().create_razorpay_order_for_completed_activity(
        database_session=database_session,
        current_user=current_user,
        request=request,
    )


@payment_processing_router.post(
    "/razorpay/verify", response_model=PaymentStatusResponse
)
async def verify_razorpay_payment(
    request: VerifyRazorpayPaymentRequest,
    current_user: AuthenticatedUserContext = Depends(extract_authenticated_user),
    database_session: Session = Depends(get_database_session),
):
    """Verify Razorpay Checkout result before marking payment completed."""
    return await create_payment_processing_service().verify_razorpay_payment(
        database_session=database_session,
        current_user=current_user,
        request=request,
    )


@payment_processing_router.get("/my-payments", response_model=list[PaymentStatusResponse])
def list_my_payments(
    current_user: AuthenticatedUserContext = Depends(extract_authenticated_user),
    database_session: Session = Depends(get_database_session),
):
    """Return employee payment history."""
    return create_payment_processing_service().list_my_payments(
        database_session=database_session,
        current_user=current_user,
    )


@payment_processing_router.get("/{payment_id}", response_model=PaymentStatusResponse)
def get_payment_status(
    payment_id: str,
    current_user: AuthenticatedUserContext = Depends(extract_authenticated_user),
    database_session: Session = Depends(get_database_session),
):
    """Return payment status to the owning employee or authorized admin."""
    return create_payment_processing_service().get_payment_status_for_user(
        database_session=database_session,
        current_user=current_user,
        payment_id=payment_id,
    )


@payment_processing_router.post(
    "/razorpay/webhook", response_model=RazorpayWebhookProcessingResponse
)
async def process_razorpay_webhook(
    request: Request,
    x_razorpay_signature: str | None = Header(default=None),
    database_session: Session = Depends(get_database_session),
):
    """Process verified Razorpay webhook events idempotently."""
    raw_body = await request.body()
    payment_service = create_payment_processing_service()
    if not payment_service.razorpay_gateway_service.verify_webhook_signature(
        raw_body, x_razorpay_signature
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay webhook signature",
        )

    event_payload = json.loads(raw_body.decode("utf-8"))
    event_name = event_payload.get("event", "")
    payment_entity = (
        event_payload.get("payload", {})
        .get("payment", {})
        .get("entity", {})
    )
    order_id = payment_entity.get("order_id")
    if not order_id:
        return RazorpayWebhookProcessingResponse(
            processed=False, message="Webhook has no order id"
        )

    payment_record = (
        database_session.query(PaymentRecord)
        .filter(PaymentRecord.razorpay_order_id == order_id)
        .first()
    )
    if payment_record is None:
        return RazorpayWebhookProcessingResponse(
            processed=False, message="Payment record not found"
        )
    if payment_record.status == "completed":
        return RazorpayWebhookProcessingResponse(
            processed=True, message="Payment already completed"
        )

    if event_name in {"payment.captured", "order.paid"}:
        payment_record.status = "processing"
        payment_record.razorpay_payment_id = payment_entity.get("id")
        database_session.commit()
        return RazorpayWebhookProcessingResponse(
            processed=True, message="Payment capture webhook recorded"
        )
    if event_name == "payment.failed":
        payment_record.status = "failed"
        payment_record.failure_reason = "Razorpay reported payment failure"
        database_session.commit()
        await payment_service.send_payment_failed_email_for_record(
            database_session, payment_record
        )
        return RazorpayWebhookProcessingResponse(
            processed=True, message="Payment failure webhook recorded"
        )

    return RazorpayWebhookProcessingResponse(
        processed=False, message="Webhook event ignored"
    )

