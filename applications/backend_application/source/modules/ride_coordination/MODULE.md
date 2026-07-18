# Ride Coordination

## Module purpose

Owns the employee-facing ride domain: passenger ride requests (Find a Ride),
driver ride offers (Offer a Ride), the bookings that match a request to an
offer, the per-booking OTP-gated trip lifecycle, and live location tracking.

## Owned responsibilities

- Persisting ride requests, ride offers, bookings, and live location pings.
- Server-authoritative fare calculation (`distance × cost/km × seats × 1.10`).
- Proximity- and time-based matching using organization-configured radii.
- Atomic booking so a request is fulfilled exactly once and offers are never
  oversold, whether a passenger books an offer or a driver accepts a request.
- Trip lifecycle: journey start, per-booking OTP verification at pickup, trip
  and journey completion.
- Recording and serving the driver's live location during an active journey.
- Employee ride history and personal report summaries from completed bookings.

## Responsibilities not owned

- Authentication and account provisioning (administrator_authentication).
- Employee identity/profile and onboarding (employee_management,
  employee_self_service).
- Vehicle records (vehicle_management).
- Fare/matching configuration values (company_settings).
- Payments, wallet, and chat transport.

## Public operations (HTTP)

Prefix `/api/v1/rides`, all requiring an authenticated EMPLOYEE.

- `POST /fare-estimate` — quote a fare (screen 1B).
- `POST /requests` — create a request, return matching offers (1B.1/1B.2).
- `POST /bookings` — passenger books an offer (Select Ride, 1C).
- `GET /requests/mine` — the passenger's ride requests.
- `POST /offers` — publish an offer, return matching requests (2B.1/2B.2).
- `GET /offers/mine` — the driver's ride offers.
- `POST /offers/accept` — driver accepts matching requests (2C).
- `GET /bookings/as-passenger` — bookings where the caller is the passenger
  (OTP included).
- `GET /bookings/as-driver` — bookings where the caller is the driver
  (OTP withheld).
- `GET /history` - completed bookings where the caller was passenger or driver.
- `GET /reports/summary` - employee-only ride metrics from completed bookings.
- `POST /offers/{id}/start` — start the journey (1D/2C).
- `POST /bookings/{id}/verify-otp` — driver verifies pickup OTP.
- `POST /bookings/{id}/complete`, `POST /offers/{id}/complete`.
- `POST /offers/{id}/location`, `GET /bookings/{id}/tracking` — live tracking.

## Internal responsibility map

```text
*_record_model.py            - SQLAlchemy models (request/offer/booking/ping)
ride_status_definitions.py   - status vocabularies (enums)
ride_coordination_contracts  - Pydantic request/result contracts
ride_coordination_repository - all persistence + atomic claim/reserve guards
geospatial_distance_*        - haversine proximity distance
route_distance_service.py    - Google Directions distance (haversine fallback)
fare_calculation_service.py  - fare formula
ride_matching_service.py     - proximity + time matching (both directions)
ride_booking_service.py      - atomic booking (savepoint-guarded)
trip_lifecycle_service.py    - start / OTP / complete / location
ride_view_assembly.py        - enrich records into API responses
ride_discovery_http_routes   - fare/find/offer/booking endpoints
ride_trip_http_routes        - accept/lists/lifecycle/tracking endpoints
```

## Dependencies and side effects

- Reads company_settings for `travel_cost_per_kilometer`, currency, and the
  pickup/drop match radii.
- Resolves employees and vehicles through their modules' public interfaces.
- Calls the Google Directions API for driving distance when a key is set.

## Invariants and security-sensitive rules

- A `ride_request` is claimed to `MATCHED` by exactly one booking
  (`ride_booking_records.ride_request_id` is unique; the claim is a guarded
  conditional update inside a SAVEPOINT).
- An offer's `seats_available` never goes negative (guarded decrement).
- The OTP is generated per booking and is only ever returned to the passenger
  who owns the booking; driver-facing responses omit it.
- Location may be posted only while the journey is `STARTED`.
- All queries are scoped to the caller's organization.

## Tests

Exercised end-to-end via the API in the session smoke test (admin
provisioning → onboarding → both booking directions → OTP → tracking →
completion). A permanent test suite is a follow-up.
```
