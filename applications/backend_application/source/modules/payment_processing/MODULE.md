# Payment Processing

## Module purpose

Settles the fare on a completed ride booking. The passenger is the payer and the
driver is the payee; a successful payment marks the booking PAID and credits the
fare into the driver's wallet.

## Owned responsibilities

- Persisting one `PaymentRecord` per booking (unique per activity).
- Validating that a booking is payable: caller is the passenger, trip is
  COMPLETED, not already paid, fare > 0.
- Card/UPI settlement via Razorpay: create order, then verify the Checkout
  signature and settle.
- Cash and wallet settlement directly (wallet also debits the passenger).
- Crediting the driver's wallet earning and marking the booking PAID atomically
  with the payment record.
- Processing signed Razorpay webhooks as an idempotent completion backstop.
- Serving an employee their payments (as payer or payee).

## Responsibilities not owned

- Wallet balances and the ledger (wallet).
- Direct Razorpay calls and HMAC checks (payment_gateway).
- Booking creation and the trip lifecycle (ride_coordination); this module only
  reads a booking and sets its `payment_status`.

## Public operations

HTTP, prefix `/api/v1/payments`, authenticated EMPLOYEE (except the webhook,
which is authenticated by signature):

- `POST /razorpay/orders` — open a card/UPI order for a booking's fare.
- `POST /razorpay/verify` — verify Checkout and settle.
- `POST /bookings/{ride_booking_id}/pay` — settle directly by cash or wallet.
- `GET /my-payments` — payments the caller paid or earned.
- `GET /{payment_id}` — one payment (payer or payee only).
- `POST /razorpay/webhook` — signed webhook completion backstop.

## Internal responsibility map

```text
payment_record_model.py           - fare payment per booking
payment_processing_contracts.py   - Pydantic request/result contracts + methods
payment_processing_service.py     - payable-booking checks, Razorpay, settlement
payment_processing_http_routes.py - order/verify/pay/list/get/webhook endpoints
public_interface.py               - service + contracts for wiring/notifications
```

## Dependencies and side effects

- `payment_gateway` for Razorpay order creation and signature verification.
- `wallet` public interface for the fare debit/credit (same transaction).
- `ride_coordination` `RideBookingRecord` for the fare and `payment_status`.
- `employee_management` to resolve the authenticated employee.

## Invariants and security-sensitive rules

- One payment per booking — unique `(organization_id, activity_id,
  activity_type)`; a COMPLETED payment cannot be paid again.
- Only the booking's passenger may pay; a payment is visible only to its payer
  or payee.
- Razorpay completion happens only after the signature verifies on the backend.
- Verify and webhook are idempotent: an already-COMPLETED payment is never
  re-settled, so the driver is never double-credited.
- The driver wallet credit, the booking `payment_status`, and the payment status
  commit together; a wallet-payment shortfall rolls the whole thing back.

## Tests

Razorpay math and signature verification are covered in
`tests/test_payment_and_wallet.py`; the wallet transfer helpers this module
calls are covered there too.
