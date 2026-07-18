# Razorpay Payment and Nodemailer Email Integration

## Purpose

This integration adds reusable employee payment infrastructure for completed carpooling activities. It does not implement ride discovery, ride booking, matching, routing, or live tracking.

## Repository architecture analyzed

- Backend: FastAPI in `applications/backend_application`.
- Frontend: React + Vite in `applications/web_administration_portal`.
- Email: no existing Node email service was present, so the smallest internal Node/Nodemailer bridge was added at `applications/email_notification_service`.
- Existing completed activity model detected: `applications/backend_application/source/modules/trip_statistics/trip_record_model.py`.
- Existing completion status detected: `TripRecord.status == "COMPLETED"`; the payment service also accepts other common completed strings for future compatibility.

## Payment lifecycle

1. A future ride/trip/activity module marks an employee activity completed.
2. The backend resolves a trusted amount from backend-owned activity data.
3. `PaymentProcessingService.create_pending_payment_for_completed_activity` creates a pending payment.
4. The employee sees a `Pay Now` button.
5. The backend creates a Razorpay order.
6. The frontend opens Razorpay Checkout.
7. The frontend posts the Razorpay result to the backend.
8. The backend verifies the signature and only then marks the payment completed.
9. The backend calls the internal Nodemailer bridge for payment success email.

## Machine-readable payment integration

```yaml
integration:
  name: employee_completed_activity_payment
  provider: razorpay
  trigger: activity_completed
  payer_role: employee
  payment_service: "applications/backend_application/source/modules/payment_processing/payment_processing_service.py"
  create_order_function: "PaymentProcessingService.create_razorpay_order_for_completed_activity"
  verify_payment_function: "PaymentProcessingService.verify_razorpay_payment"
  reusable_pending_payment_function: "PaymentProcessingService.create_pending_payment_for_completed_activity"
  frontend_component: "applications/web_administration_portal/source/features/payment_processing/CompletedActivityPayment.tsx"
  documentation: "docs/PAYMENT_INTEGRATION.md"
```

## Machine-readable email integration

```yaml
email_integration:
  provider: nodemailer
  transport: smtp
  service: "applications/email_notification_service/source/paymentEmailService.js"
  payment_pending_function: "sendPaymentPendingEmail"
  payment_success_function: "sendPaymentSuccessEmail"
  payment_failed_function: "sendPaymentFailedEmail"
  templates: "applications/email_notification_service/source/paymentEmailTemplates.js"
  internal_routes: "applications/email_notification_service/source/server.js"
  enabled_variable: "EMAIL_ENABLED"
```

## Backend API endpoints

- `POST /api/v1/payments/razorpay/orders`
- `POST /api/v1/payments/razorpay/verify`
- `GET /api/v1/payments/my-payments`
- `GET /api/v1/payments/{payment_id}`
- `POST /api/v1/payments/razorpay/webhook`

## Database model

`PaymentRecord` lives at `applications/backend_application/source/modules/payment_processing/payment_record_model.py`.

Important fields:

- `employee_id`
- `activity_id`
- `activity_type`
- `amount`
- `currency`
- `status`
- `razorpay_order_id`
- `razorpay_payment_id`
- `razorpay_signature_reference`
- `failure_reason`
- `payment_metadata`
- `paid_at`

The table prevents duplicate payment rows per `organization_id`, `activity_id`, and `activity_type`.

## Frontend components

- `RazorpayCheckoutButton`
- `CompletedActivityPayment`
- `PaymentStatusBadge`
- `PaymentHistory`

Locations: `applications/web_administration_portal/source/features/payment_processing`.

## Master-agent integration points

Search for:

```text
RAZORPAY_EMPLOYEE_PAYMENT_INTEGRATION
MASTER_AGENT_INTEGRATION_POINT
TRIGGER_AFTER_COMPLETED_ACTIVITY
```

The future ride/trip agent should call:

```python
PaymentProcessingService(configuration).create_pending_payment_for_completed_activity(
    database_session=database_session,
    organization_id=organization_id,
    request=CreatePendingPaymentForCompletedActivityRequest(
        employee_id=employee_id,
        activity_id=activity_id,
        activity_type="trip",
        amount=backend_controlled_amount,
        currency="INR",
        metadata={"route_summary": "..."},
    ),
)
```

Search for:

```text
NODEMAILER_PAYMENT_EMAIL_INTEGRATION
MASTER_AGENT_EMAIL_INTEGRATION_POINT
```

The FastAPI backend sends email events to the internal Node service. SMTP failure is logged safely and does not roll back payment state.

## Environment variables

Add real values only in `.env`, never in source control. `.env.example` contains placeholders for:

- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `RAZORPAY_CURRENCY`, `RAZORPAY_COMPANY_NAME`, `RAZORPAY_COMPANY_DESCRIPTION`, `RAZORPAY_THEME_COLOR`.
- Vite public key: `VITE_RAZORPAY_KEY_ID`.
- Email bridge: `EMAIL_NOTIFICATION_SERVICE_URL`, `INTERNAL_EMAIL_SERVICE_TOKEN`, `EMAIL_SERVICE_PORT`.
- Nodemailer SMTP: `EMAIL_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, `EMAIL_REPLY_TO`, `PAYMENT_SUPPORT_EMAIL`.

## Current compatibility note

The current repository has completed trip statistics but not the final employee ride booking/passenger model. The integration therefore supports the existing `TripRecord` safely and exposes a reusable service function for the future master ride module. `TripRecord` does not currently have a persisted paid field, so `PaymentRecord.status` is the payment source of truth until the master ride model adds a paid/payment-status field.
