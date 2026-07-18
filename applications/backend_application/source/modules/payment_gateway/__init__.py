"""Payment gateway module.

A thin, side-effect-isolating adapter over the Razorpay REST API and its
HMAC signature checks. Owns no business rules and no persistence. Both fare
settlement (``payment_processing``) and wallet recharge (``wallet``) depend on
this single audited integration point so Razorpay credentials and cryptographic
verification live in exactly one place.
"""
