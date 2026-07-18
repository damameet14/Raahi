# Payment Processing Module

## Module purpose

Owns employee payments for completed transportation activities. It creates backend-controlled Razorpay orders, verifies Razorpay signatures, stores payment lifecycle state, and emits payment email events through the internal Nodemailer bridge.

## Owned responsibilities

- Detect payable completed activities currently represented by `TripRecord`.
- Create one payment record per organization/activity/activity type.
- Convert rupee amounts to Razorpay paise only at the gateway boundary.
- Verify Razorpay Checkout and webhook signatures on the backend.
- Trigger payment pending, success, and failure emails without rolling back payment state.

## Responsibilities not owned

- Ride discovery, booking, matching, routing, live tracking, or trip creation.
- SMTP delivery implementation; that is owned by `applications/email_notification_service`.
- Authentication token creation; this module consumes the existing authenticated user dependency.

## Public operations

- `create_razorpay_order_for_completed_activity`: accepts `CreateRazorpayOrderRequest`; returns `RazorpayOrderResponse`; requires an authenticated employee.
- `verify_razorpay_payment`: accepts `VerifyRazorpayPaymentRequest`; returns `PaymentStatusResponse`; requires the owning employee.
- `create_pending_payment_for_completed_activity`: accepts `CreatePendingPaymentForCompletedActivityRequest`; reusable integration point for future completed ride/activity modules.
- `get_payment_status_for_user` and `list_my_payments`: return safe payment status contracts.

## Internal responsibility map

- `payment_record_model.py`: payment persistence model.
- `payment_processing_contracts.py`: API and service contracts.
- `payment_processing_service.py`: business workflow and integration point.
- `razorpay_gateway_service.py`: Razorpay HTTP and HMAC boundary.
- `email_notification_client.py`: internal HTTP client to the Nodemailer service.
- `payment_processing_http_routes.py`: FastAPI transport routes.

## Dependencies

- Existing `EmployeeRecord`, `TripRecord`, authenticated user context, SQLAlchemy session, Razorpay HTTPS API, and internal Nodemailer HTTP service.

## Invariants

- Never trust frontend amounts.
- Never expose Razorpay secrets to frontend code.
- Never mark payment completed without backend signature verification.
- Completed payments are idempotent and cannot be overwritten by later failure events.
- Email failure must not roll back a completed payment.

## Tests

- Focused payment tests are in `applications/backend_application/tests/test_payment_processing.py`.
