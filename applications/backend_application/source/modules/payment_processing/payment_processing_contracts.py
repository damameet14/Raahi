"""Input and output contracts for ride-booking fare payments."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

PaymentMethod = Literal["CASH", "CARD", "UPI", "WALLET"]
PaymentStatus = Literal["PENDING", "CREATED", "COMPLETED", "FAILED"]
_DIRECT_SETTLEMENT_METHOD = Literal["CASH", "WALLET"]


class CreateRazorpayOrderRequest(BaseModel):
    """Request to open a Razorpay order for a completed booking's fare."""

    ride_booking_id: str
    method: Literal["CARD", "UPI"] = "UPI"


class RazorpayOrderResponse(BaseModel):
    """Frontend-safe Razorpay Checkout details for a fare payment."""

    payment_id: str
    ride_booking_id: str
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


class PayBookingRequest(BaseModel):
    """Directly settle a completed booking's fare by cash or wallet."""

    method: _DIRECT_SETTLEMENT_METHOD


class PaymentResponse(BaseModel):
    """Safe fare-payment state returned to callers."""

    id: str
    ride_booking_id: str
    payer_employee_id: str
    payee_employee_id: str
    method: PaymentMethod
    amount: float
    currency: str
    status: PaymentStatus
    razorpay_order_id: str | None
    razorpay_payment_id: str | None
    failure_reason: str | None
    created_at: datetime
    updated_at: datetime
    paid_at: datetime | None


class RazorpayWebhookProcessingResponse(BaseModel):
    """Result of processing one Razorpay webhook event."""

    processed: bool
    message: str
