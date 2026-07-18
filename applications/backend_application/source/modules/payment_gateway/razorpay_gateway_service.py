"""Razorpay gateway adapter: order creation and signature verification.

Isolates every direct Razorpay HTTP call and every HMAC signature check so
that fare settlement and wallet recharge share one integration point. Depends
only on the application configuration; it holds no business rules and touches
no database.
"""

import hashlib
import hmac
import logging
from decimal import Decimal, ROUND_HALF_UP

import httpx
from fastapi import HTTPException, status

from source.application_startup.application_configuration import (
    ApplicationConfiguration,
)

logger = logging.getLogger(__name__)

_RAZORPAY_ORDERS_ENDPOINT = "https://api.razorpay.com/v1/orders"
# Razorpay rejects an order whose ``receipt`` is longer than 40 characters.
_RAZORPAY_RECEIPT_MAX_LENGTH = 40
_ORDER_REQUEST_TIMEOUT_SECONDS = 15.0


class RazorpayGatewayService:
    """Owns all direct calls and cryptographic checks for Razorpay."""

    def __init__(self, configuration: ApplicationConfiguration):
        self.configuration = configuration

    def convert_rupees_to_paise(self, rupee_amount: float) -> int:
        """Convert a rupee amount to integer paise using decimal rounding."""
        decimal_amount = Decimal(str(rupee_amount)).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        return int(decimal_amount * 100)

    def are_credentials_configured(self) -> bool:
        """Report whether both Razorpay API credentials are present."""
        return bool(
            self.configuration.razorpay_key_id
            and self.configuration.razorpay_key_secret
        )

    async def create_order(
        self,
        *,
        amount_in_rupees: float,
        currency: str,
        receipt_reference: str,
    ) -> dict:
        """Create a Razorpay order from backend-controlled amount data.

        Raises HTTP 503 if credentials are missing and HTTP 502 if Razorpay
        rejects the request, so callers surface a clean gateway error.
        """
        if not self.are_credentials_configured():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Razorpay credentials are not configured",
            )

        order_payload = {
            "amount": self.convert_rupees_to_paise(amount_in_rupees),
            "currency": currency,
            "receipt": receipt_reference[:_RAZORPAY_RECEIPT_MAX_LENGTH],
            "payment_capture": 1,
        }
        async with httpx.AsyncClient(
            timeout=_ORDER_REQUEST_TIMEOUT_SECONDS
        ) as http_client:
            response = await http_client.post(
                _RAZORPAY_ORDERS_ENDPOINT,
                json=order_payload,
                auth=(
                    self.configuration.razorpay_key_id,
                    self.configuration.razorpay_key_secret,
                ),
            )
        if response.status_code >= 400:
            logger.warning(
                "Razorpay order creation failed (%s): %s",
                response.status_code,
                response.text[:500],
            )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Razorpay order creation failed",
            )
        return response.json()

    def verify_checkout_signature(
        self,
        *,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        submitted_signature: str,
    ) -> bool:
        """Verify a Razorpay Checkout success signature on the backend."""
        if not self.configuration.razorpay_key_secret:
            return False
        signature_payload = (
            f"{razorpay_order_id}|{razorpay_payment_id}".encode()
        )
        expected_signature = hmac.new(
            self.configuration.razorpay_key_secret.encode(),
            signature_payload,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected_signature, submitted_signature)

    def verify_webhook_signature(
        self,
        *,
        raw_request_body: bytes,
        submitted_signature: str | None,
    ) -> bool:
        """Verify a Razorpay webhook signature before trusting the event."""
        if (
            not self.configuration.razorpay_webhook_secret
            or not submitted_signature
        ):
            return False
        expected_signature = hmac.new(
            self.configuration.razorpay_webhook_secret.encode(),
            raw_request_body,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected_signature, submitted_signature)
