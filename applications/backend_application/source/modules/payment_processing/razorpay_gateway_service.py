"""Razorpay gateway adapter for order creation and signature verification."""

import hashlib
import hmac
from decimal import Decimal, ROUND_HALF_UP

import httpx
from fastapi import HTTPException, status

from source.application_startup.application_configuration import ApplicationConfiguration


class RazorpayGatewayService:
    """Owns all direct calls and cryptographic checks for Razorpay."""

    def __init__(self, configuration: ApplicationConfiguration):
        self.configuration = configuration

    def convert_rupees_to_paise(self, rupee_amount: float) -> int:
        """Convert rupees to paise using decimal rounding."""
        decimal_amount = Decimal(str(rupee_amount)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        return int(decimal_amount * 100)

    async def create_order(self, amount: float, currency: str, receipt: str) -> dict:
        """Create a Razorpay order from backend-controlled amount data."""
        if not self.configuration.razorpay_key_id or not self.configuration.razorpay_key_secret:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Razorpay credentials are not configured",
            )

        order_payload = {
            "amount": self.convert_rupees_to_paise(amount),
            "currency": currency,
            "receipt": receipt,
            "payment_capture": 1,
        }
        async with httpx.AsyncClient(timeout=15.0) as http_client:
            response = await http_client.post(
                "https://api.razorpay.com/v1/orders",
                json=order_payload,
                auth=(
                    self.configuration.razorpay_key_id,
                    self.configuration.razorpay_key_secret,
                ),
            )
        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Razorpay order creation failed",
            )
        return response.json()

    def verify_checkout_signature(
        self,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        submitted_signature: str,
    ) -> bool:
        """Verify Razorpay Checkout signature on the backend."""
        if not self.configuration.razorpay_key_secret:
            return False
        signature_payload = f"{razorpay_order_id}|{razorpay_payment_id}".encode()
        expected_signature = hmac.new(
            self.configuration.razorpay_key_secret.encode(),
            signature_payload,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected_signature, submitted_signature)

    def verify_webhook_signature(self, raw_body: bytes, submitted_signature: str | None) -> bool:
        """Verify Razorpay webhook signature before trusting the event."""
        if not self.configuration.razorpay_webhook_secret or not submitted_signature:
            return False
        expected_signature = hmac.new(
            self.configuration.razorpay_webhook_secret.encode(),
            raw_body,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected_signature, submitted_signature)

