"""Focused tests for payment processing rules that avoid real Razorpay calls."""

import hmac
import hashlib

from source.application_startup.application_configuration import ApplicationConfiguration
from source.modules.payment_processing.razorpay_gateway_service import RazorpayGatewayService


def test_razorpay_amount_conversion_uses_paise():
    gateway_service = RazorpayGatewayService(ApplicationConfiguration())

    assert gateway_service.convert_rupees_to_paise(500) == 50000
    assert gateway_service.convert_rupees_to_paise(12.345) == 1235


def test_valid_razorpay_checkout_signature_is_accepted():
    configuration = ApplicationConfiguration(
        RAZORPAY_KEY_SECRET="test_secret",
    )
    gateway_service = RazorpayGatewayService(configuration)
    expected_signature = hmac.new(
        b"test_secret",
        b"order_123|pay_456",
        hashlib.sha256,
    ).hexdigest()

    assert gateway_service.verify_checkout_signature(
        "order_123", "pay_456", expected_signature
    )


def test_invalid_razorpay_checkout_signature_is_rejected():
    configuration = ApplicationConfiguration(
        RAZORPAY_KEY_SECRET="test_secret",
    )
    gateway_service = RazorpayGatewayService(configuration)

    assert not gateway_service.verify_checkout_signature(
        "order_123", "pay_456", "bad_signature"
    )
