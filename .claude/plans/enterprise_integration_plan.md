# Raahi — Payments, Communication & Notifications Integration Plan

## Context

`main` already implements authentication, ride discovery/publishing, route
confirmation, ride booking, trip management, live tracking, vehicle
management, saved places, ride history, and reports/analytics for the
employee PWA. The remaining problem-statement gaps are **Payments & Wallet**,
**in-app chat**, **email**, and **WhatsApp notifications**. The
`razorpay-nodemailer-integration` branch contains a Razorpay payment module,
a Node Nodemailer email service, and a Node whatsapp-web.js server — but built
against the *old admin portal + `TripRecord`*, and its WhatsApp piece is a RAG
chatbot, not an outbound notifier. So this is adaptation, not copy-paste.

The `integration_placeholders` feature already reserves `payments` and `chat`
routes in the PWA, confirming these are the intended slots.

## Decisions (confirmed with user)

- **WhatsApp**: reuse the branch's `whatsapp-web.js` Node server as a pure
  **outbound sender**; FastAPI calls it over HTTP. Drop the RAG chatbot/agent.
- **Email**: **Python SMTP inside FastAPI** (`smtplib`), behind `EMAIL_ENABLED`
  with safe log-only fallback. No separate Node service.
- **Chat**: text-only **WebSocket group chat per journey** (driver + accepted
  passengers). "Call" = `tel:` deep link to the other party's phone.
- **Payments/Wallet**: full problem-statement scope — Cash, Card, UPI, Wallet;
  wallet recharge via Razorpay; view balance; wallet-paid fares. Passenger pays
  the fare on a completed trip; **payment credits the driver's wallet** (P2P
  ledger) so drivers accumulate spendable balance.
- **Scheduler**: in-process **APScheduler** for the 15-minute pre-ride reminders.
- **Out of scope**: RAG/AI WhatsApp chatbot, WebRTC voice calling.

## Cross-cutting principles

- All notification sends (email + WhatsApp) are **best-effort and non-blocking**:
  a channel failure is logged and never rolls back ride/payment state.
- New tables are created by `create_all`; new columns on existing tables go
  through `_DEVELOPMENT_SCHEMA_ADDITIONS` in
  `applications/backend_application/source/application_startup/main.py`.
- Follow `ai-navigable-modular-coding`: one business module per capability,
  descriptive names, public interfaces, request/result contracts.
- After each phase: `project-index scan`, backend import/route checks,
  `tsc -b` + `vite build` for the PWA.

---

## Phase 0 — Foundations: config + notification dispatch + WhatsApp sidecar  ✅ DONE

**Status:** committed. Config fields added
(`application_configuration.py`: Razorpay/SMTP/WhatsApp). New
`modules/notifications` module built: `email_delivery_service.send_email`
(smtplib, `EMAIL_ENABLED` gate, safe log-only fallback),
`whatsapp_delivery_service.send_whatsapp_message` (httpx → sidecar,
`WHATSAPP_ENABLED` gate), `notification_templates`,
`notification_dispatch_service.send_employee_temporary_password_notification`,
and `public_interface`. `apscheduler` added to requirements. WhatsApp sidecar
ported to `applications/whatsapp_server` as an outbound-only sender
(`POST /internal/send-message`, key-guarded; agent chatbot removed). All sends
are best-effort/non-blocking. Verified: config loads, notifications import +
log-only send OK, sidecar JS `node --check` OK.

_Original plan:_

**Backend config** (`application_configuration.py`): add fields for Razorpay
(`RAZORPAY_KEY_ID/KEY_SECRET/WEBHOOK_SECRET/CURRENCY/COMPANY_NAME/…`), SMTP
(`EMAIL_ENABLED/SMTP_HOST/PORT/SECURE/USER/PASSWORD/EMAIL_FROM_*`), and the
WhatsApp bridge (`WHATSAPP_SERVICE_URL`, `WHATSAPP_NOTIFICATION_API_KEY`).

**New shared module** `modules/notifications`:
- `notification_dispatch_service.py` — one entry point per business event
  (e.g. `notify_booking_confirmed`, `notify_journey_started`, …) that fans out
  to email + WhatsApp channels; every send wrapped in try/except + logging.
- `email_delivery_service.py` — `smtplib` sender + `EMAIL_ENABLED` gate + templates.
- `whatsapp_delivery_service.py` — `httpx` POST to the sidecar `/internal/send-message`.
- `notification_templates.py` — message/subject builders per event and party.

**WhatsApp sidecar**: port `applications/whatsapp_server` to `main`. Remove the
agent-chatbot handlers (`agentClient`, `handlers`) and add
`POST /internal/send-message { phoneNumber, message }` guarded by
`X-WhatsApp-Notification-Key`. Keep QR-based `whatsapp-web.js` client + `/health`.

Deps: add `apscheduler` to `requirements.txt` (httpx already present; email uses stdlib).

## Phase 1 — Email service wired to admin employee provisioning  ✅ DONE

**Status:** committed. Added `shared_infrastructure/application_configuration_dependency.py`
(`get_application_configuration`, an `lru_cache` FastAPI dependency so routes
inject config without importing the entry-point singleton). The
`create_employee` and `reset_employee_password` routes in
`employee_management_http_routes.py` now inject configuration and call
`send_employee_temporary_password_notification` through a local best-effort
helper (`_notify_employee_temporary_password`) that swallows/logs any failure
so a notification error never surfaces as an HTTP error after provisioning has
committed. The welcome/temporary-password email template already existed from
Phase 0. Payment email templates are deferred to Phase 5 where they are first
consumed (avoids dead code). Verified: routes + app import OK (65 routes), and
a log-only/best-effort notification send returns without raising even when SMTP
is unreachable.

_Original plan:_

- Templates: temporary-password/welcome email, payment pending/success/failed.
- Trigger the temp-password email from the employee-creation and
  password-reset flows in `modules/employee_management` (where
  `generate_temporary_password` / `provision_employee_with_login_account` /
  `reset_employee_password` live). Include employee name, login email, temp
  password, and login URL.
- Verify with a log-only run (`EMAIL_ENABLED=false`) and, if SMTP creds exist,
  a real send to a test inbox.

## Phase 2 — Payments & Wallet (backend)  ✅ DONE

**Status:** committed. Three modules added and wired into `main.py` (models
imported for `create_all`, routers registered, `ride_booking_records.payment_status`
added to `_DEVELOPMENT_SCHEMA_ADDITIONS`).

- `modules/payment_gateway` — shared `RazorpayGatewayService` adapter (rupees→paise,
  async order creation, checkout + webhook HMAC verify). No business rules; both
  wallet recharge and fare settlement depend on it, keeping the module graph acyclic
  (`payment_gateway` ← `wallet` ← `payment_processing`).
- `modules/wallet` — `WalletRecord` (balance per employee) + `WalletTransactionRecord`
  (append-only ledger: RECHARGE/RIDE_PAYMENT/RIDE_EARNING, signed by `direction`,
  `balance_after` snapshot). `wallet_service` owns credit/debit (flush-only, caller
  commits), recharge order+verify (self-committing), and the public ride-transfer
  helpers `credit_wallet_for_ride_earning` / `debit_wallet_for_ride_payment`
  (`InsufficientWalletBalanceError`). Routes `/api/v1/wallet`: balance, transactions,
  recharge orders/verify.
- `modules/payment_processing` — `PaymentRecord` keyed to a booking
  (`activity_type="ride_booking"`, payer=passenger, payee=driver, `method`
  CASH/CARD/UPI/WALLET). `PaymentProcessingService` validates a payable booking
  (passenger-only, COMPLETED, UNPAID, fare>0), settles Card/UPI via Razorpay
  order+verify and Cash/Wallet directly, and on settlement marks the booking PAID +
  credits the driver's wallet (Wallet also debits the passenger) in one transaction.
  Idempotent verify + signed webhook backstop prevent double-crediting. Routes
  `/api/v1/payments`: razorpay/orders, razorpay/verify, bookings/{id}/pay,
  my-payments, {id}, razorpay/webhook.

Verified: app assembles (75 routes, all payment/wallet paths present);
`tests/test_payment_and_wallet.py` (4 tests) green — paise rounding, HMAC
checkout verify, wallet credit→debit ledger, insufficient-balance guard. Payment
email/WhatsApp notifications are deferred to Phase 5 where they are consumed.
Boundary note: direct imports of `EmployeeRecord` / `current_employee_http_dependency`
and the ride booking model match the repo's existing convention (ride_coordination
exposes no public_interface; models are imported directly across the app).

_Original plan:_

**`modules/payment_processing`** (adapt from branch):
- `PaymentRecord` keyed to ride bookings: `activity_type="ride_booking"`,
  `activity_id=ride_booking_id`, `payer_employee_id`, `payee_employee_id`,
  `method` (`CASH|CARD|UPI|WALLET`), Razorpay fields, `status`.
- `razorpay_gateway_service.py` — reuse verbatim (httpx order + HMAC verify).
- `payment_processing_service.py` — adapt `resolve_completed_payable_activity`
  to read `RideBookingRecord` (status `COMPLETED`, `fare_amount`), payer =
  passenger, payee = driver. Methods: create-order+verify (Card/UPI),
  cash-confirm, wallet-pay. On completion: mark booking paid + credit driver wallet.
- Routes `/api/v1/payments`: `POST /razorpay/orders`, `POST /razorpay/verify`,
  `POST /bookings/{id}/pay` (method-aware), `GET /my-payments`, `GET /{id}`,
  `POST /razorpay/webhook`.

**`modules/wallet`**:
- `WalletRecord` (per employee balance) + `WalletTransactionRecord` (ledger:
  RECHARGE, RIDE_PAYMENT, RIDE_EARNING).
- Recharge via Razorpay (order → verify → credit). Pay-fare-from-wallet
  (debit passenger, credit driver). `GET /wallet` (balance),
  `GET /wallet/transactions`, recharge order/verify endpoints.
- Add booking `payment_status` column (`UNPAID|PAID`) via schema-additions.

## Phase 3 — Payments & Wallet (PWA frontend)

- Replace the payments placeholder route. On a **completed** ride detail:
  method chooser (Cash / Card / UPI / Wallet) → Razorpay Checkout (script
  loaded on demand) for Card/UPI, wallet-pay for Wallet, cash-confirm for Cash.
- **Wallet screen**: balance, recharge (Razorpay), transaction list.
- Show payment status/receipt in Ride History; keep report metrics consistent
  with the existing `EmployeeRideReportSummary`.
- API client + types in `backend_communication` mirroring the new endpoints.

## Phase 4 — Live group chat (WebSocket)

**Backend `modules/journey_chat`**:
- `ChatMessageRecord` (ride_offer_id, sender_employee_id, body, created_at).
- WS endpoint `/api/v1/ws/journeys/{ride_offer_id}/chat` — token-authenticated;
  membership = driver + passengers with a non-cancelled booking on that offer.
- In-process connection manager broadcasting per `ride_offer_id`; persist each
  message; REST `GET /api/v1/journeys/{ride_offer_id}/messages` for history.

**Frontend**: replace the chat placeholder with `JourneyChatPage` (WS hook,
message list, composer), reachable from ride-detail/ongoing screens. A **Call**
button uses `tel:` to the counterpart's phone.

## Phase 5 — WhatsApp ride notifications + 15-minute reminders

- Fire `NotificationDispatchService` events at each lifecycle transition in
  `ride_coordination` (booking confirmed, request accepted, journey started,
  pickup/OTP verified, trip completed, cancellations) — messaging **both** the
  driver and affected passenger(s).
- **APScheduler** job (started in `application_lifespan`): every minute, find
  offers departing in ~15 min and send passengers a "be ready" message and the
  driver a consolidated pickup summary; dedupe with a `reminder_sent` flag.
- Payment success/failure also emails (Phase 1 templates) + optional WhatsApp.

## Phase 6 — Wire-up, compose, docs, verification

- Register all routers in `main.py`; add new tables/columns to schema-additions;
  update `.env.example` files (backend + PWA + whatsapp sidecar).
- `docker-compose.yml` for backend + whatsapp sidecar (adapt branch's compose).
- Short run docs (README): start backend, start sidecar + scan QR, env vars.
- Final: `project-index scan`, backend import/route checks, `tsc -b`,
  `vite build`; smoke-test the end-to-end flows I can exercise locally.

## Verification per phase

- Backend: `.venv/Scripts/python.exe` import + route-registration checks; unit
  checks on pure logic (fare→paise, signature verify, wallet debit/credit,
  reminder windowing).
- Frontend: `tsc -b` and `vite build`.
- Live end-to-end (Razorpay test checkout, real WhatsApp QR, SMTP inbox) stays
  with the user, since those need real accounts/DB the sandbox lacks.

## Testing caveats (user-owned)

- WhatsApp needs a real phone to scan the QR and real employee phone numbers
  (demo data is fake `+91-98765…`).
- Razorpay needs the test key **secret** in the backend `.env`
  (`VITE_RAZORPAY_KEY_ID` is already set for the browser).
- Email needs SMTP creds (Gmail app password or Mailtrap) to send for real.
- Backend must be restarted so new tables/columns migrate on startup.
