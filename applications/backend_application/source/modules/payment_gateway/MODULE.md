# Payment Gateway

## Module purpose

A thin adapter over the Razorpay REST API and its HMAC signature checks. It is
the single audited integration point for Razorpay, shared by fare settlement and
wallet recharge.

## Owned responsibilities

- Creating Razorpay orders from a backend-controlled amount.
- Converting rupees to integer paise with decimal rounding.
- Verifying Razorpay Checkout success signatures.
- Verifying Razorpay webhook signatures.

## Responsibilities not owned

- Any business rule, amount decision, or persistence — callers own those.

## Public operations

`public_interface.py` exports `RazorpayGatewayService`, constructed with the
application configuration:

- `convert_rupees_to_paise(rupee_amount)`
- `are_credentials_configured()`
- `async create_order(*, amount_in_rupees, currency, receipt_reference)`
- `verify_checkout_signature(*, razorpay_order_id, razorpay_payment_id, submitted_signature)`
- `verify_webhook_signature(*, raw_request_body, submitted_signature)`

## Dependencies and side effects

- Reads Razorpay credentials from configuration.
- Makes outbound HTTPS calls to `api.razorpay.com`; performs no database access.

## Invariants and security-sensitive rules

- Signature checks use `hmac.compare_digest` (constant-time) and return False
  when the relevant secret is missing rather than accepting the request.
- `create_order` raises HTTP 503 when credentials are absent and HTTP 502 when
  Razorpay rejects the request.

## Tests

`tests/test_payment_and_wallet.py` covers rupee-to-paise rounding and checkout
signature verification.
