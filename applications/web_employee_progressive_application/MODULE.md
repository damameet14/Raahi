# Web Employee Progressive Application

## Module purpose

The employee-facing Raahi client: a mobile-first, installable PWA where an
employee logs in, onboards, finds and offers rides, and tracks trips live. It
shares the FastAPI backend with the administration portal.

## Owned responsibilities

- Splash, login (shared `/authentication/login`), forced first-login password
  change, and onboarding (vehicle question + home/office via Google Maps).
- Home with the Upcoming Rides summary and the Find/Offer Ride actions.
- Find a Ride (1A–1C), Offer a Ride (2A–2C), My Rides overview, ride detail,
  and the ongoing ride with 5-second live tracking and OTP handling.
- Google Maps place selection, route preview, and live-tracking rendering.
- Service-worker registration and manifest for installability/offline shell.

## Responsibilities not owned

- All business rules, matching, fare, and persistence (backend
  `ride_coordination` and related modules).
- Administration portal concerns.
- Payments, wallet, ride history, and reports (future).

## Internal responsibility map

```text
source/main.tsx                         - providers, router, SW registration
source/ApplicationRouter.tsx            - route map + guards
source/features/<feature>/              - one folder per screen/flow
source/shared_user_interface_infrastructure/
  authentication_state/                 - employee session context
  backend_communication/                - axios client, typed API, DTO types
  employee_profile/                     - profile query hook
  protected_route/                      - auth + onboarding route guards
  maps/                                 - Google Maps services, types, and
                                          map components (adopted + extended)
  layout/                               - app header + navigation drawer
  reusable_components/                  - button, bottom sheet, status pill
```

## Dependencies and side effects

- `@react-google-maps/api` plus `VITE_GOOGLE_MAPS_API_KEY` (Maps JS, Places,
  Routes). Without a key the app degrades: manual pin-drop and direct-line
  route fallback instead of live autocomplete/route.
- Backend REST API via the Vite `/api` proxy (dev port 5174 → backend 8000).
- `localStorage` for the employee session (keys prefixed `raahi_employee_`).

## Invariants and security-sensitive rules

- Employee session storage is namespaced separately from the admin portal.
- The pickup OTP is shown only to the passenger; the driver enters it.
- Live location is posted by the driver's device only while a trip is active.

## How to run

```bash
npm install
# set VITE_GOOGLE_MAPS_API_KEY in .env (see .env.example)
npm run dev   # http://localhost:5174, proxying /api to the backend on :8000
```
