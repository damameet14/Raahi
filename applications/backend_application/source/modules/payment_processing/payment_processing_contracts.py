"""Input and output contracts for completed-activity payment processing."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

PaymentStatus = Literal[
    "pending",
    "created",
    "processing",
    "completed",
    "failed",
    "cancelled",
    "refunded",
]


class CreateRazorpayOrderRequest(BaseModel):
    """Request to create a Razorpay order for a completed activity."""

    activity_id: str
    activity_type: str = "trip"


class RazorpayOrderResponse(BaseModel):
    """Frontend-safe checkout details for Razorpay Checkout."""

    payment_id: str
    razorpay_order_id: str
    razorpay_key_id: str
    amount: int
    currency: str
    company_name: str
    description: str
    theme_color: str


class VerifyRazorpayPaymentRequest(BaseModel):
    """Razorpay Checkout response sent to the backend for verification."""

    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class CreatePendingPaymentForCompletedActivityRequest(BaseModel):
    """Reusable integration request for future completed ride/activity modules."""

    employee_id: str
    activity_id: str
    activity_type: str = "trip"
    amount: float = Field(gt=0)
    currency: str = "INR"
    metadata: dict[str, Any] | None = None


class PaymentStatusResponse(BaseModel):
    """Safe payment status returned to frontend callers."""

    id: str
    employee_id: str
    activity_id: str
    activity_type: str
    amount: float
    currency: str
    status: str
    razorpay_order_id: str | None
    razorpay_payment_id: str | None
    failure_reason: str | None
    metadata: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
    paid_at: datetime | None
    is_retry_available: bool


class RazorpayWebhookProcessingResponse(BaseModel):
    """Webhook processing result."""

    processed: bool
    message: str

