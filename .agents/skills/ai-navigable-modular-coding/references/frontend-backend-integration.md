# Frontend and Backend Integration

## Contract as the plug

Connect frontend and backend through an explicit transport contract rather than shared implementation knowledge.

```text
user interface
    -> frontend application operation
    -> backend communication client
    -> API request contract
    -> backend transport adapter
    -> backend module public operation
    -> API response contract
    -> frontend response adapter
    -> frontend state or domain model
```

## Frontend boundaries

A user interface component should:

- collect and display values;
- invoke a frontend operation or hook;
- render loading, success, and failure states.

It should not:

- build raw URLs throughout the component tree;
- know backend database fields;
- interpret inconsistent error payloads;
- store authentication secrets directly;
- duplicate backend business rules that must remain authoritative.

## Backend communication client

Place transport details in a descriptively named client:

- `UserAuthenticationApiClient`;
- `RestaurantOrderSubmissionApiClient`;
- `InventoryAvailabilityApiClient`.

The client should accept frontend-facing request values and return typed transport results.

## API design

Prefer resource or capability-oriented routes with stable versioning. For example:

```text
POST /api/v1/user-authentication/login
```

Define:

- request body;
- successful response body;
- expected failure bodies;
- status codes;
- authentication requirements;
- validation constraints;
- idempotency expectations where relevant.

## Source of truth

Use OpenAPI or an equivalent schema as the source of truth when practical. Generate client types when generation is reliable and reviewable.

Do not manually maintain duplicate types that silently drift without tests or generation.

## Adaptation

Transport contracts and frontend domain objects do not need to be identical. Adapt at the boundary when frontend needs differ from backend representation.

Do not expose persistence records directly merely to avoid writing an adapter.

## Authentication-specific guidance

- Send credentials only over HTTPS in production.
- Store passwords only as secure password hashes on the backend.
- Use a generic invalid-credentials response to avoid account enumeration.
- Choose token storage and refresh strategy according to the application's threat model.
- Never place signing secrets in frontend code.
- Keep token generation and token validation behind backend boundaries.
