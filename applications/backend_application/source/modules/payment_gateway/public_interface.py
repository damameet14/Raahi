"""Public interface for the payment gateway module.

External modules construct and use the Razorpay adapter only from here.
"""

from source.modules.payment_gateway.razorpay_gateway_service import (
    RazorpayGatewayService,
)

__all__ = ["RazorpayGatewayService"]
