# Journey Chat

## Module purpose

A text-only group conversation per journey (one ride offer), shared by the
driver and every passenger with a non-cancelled booking on that offer.

## Owned responsibilities

- Persisting chat messages (`ChatMessageRecord`) per ride offer.
- Deciding chat membership: driver + non-cancelled-booking passengers.
- Live delivery over a WebSocket via an in-process connection manager.
- Serving the transcript to members over REST.

## Responsibilities not owned

- Voice/video calling — the UI uses a plain `tel:` link; this module has no
  calling feature.
- Ride/booking lifecycle (ride_coordination); this module only reads offers and
  bookings to compute membership.
- Notifications about new messages (out of scope).

## Public operations

- WebSocket `GET /api/v1/ws/journeys/{ride_offer_id}/chat?token=<jwt>` — live
  chat; the token is a query parameter because WebSocket handshakes carry no
  Authorization header. Non-members are closed with 4401 (bad token) or 4403
  (not a member).
- REST `GET /api/v1/journeys/{ride_offer_id}/messages` — transcript for members.

`public_interface.py` exports the membership helpers and `ChatMessageResponse`.

## Internal responsibility map

```text
chat_message_record_model.py         - persisted messages
journey_chat_contracts.py            - message + inbound contracts
journey_chat_connection_manager.py   - in-process sockets grouped per offer
journey_chat_service.py              - membership, persistence, history, naming
journey_chat_http_routes.py          - WebSocket + REST history endpoints
public_interface.py                  - membership helpers + response contract
```

## Dependencies and side effects

- `ride_coordination` offer/booking models for membership.
- `employee_management` public interface for sender display names and resolving
  the socket's employee from its account.
- Shared JWT decode (`decode_access_token_or_none`) for WebSocket auth and the
  standalone-session context manager for per-message persistence.

## Invariants and security-sensitive rules

- Only chat members may open the socket or read history; membership is checked
  on connect and on every history request.
- Message bodies are trimmed and empty messages are ignored.
- Broadcast is scoped to a single ride offer's room; a failing socket is dropped
  and never blocks delivery to the rest.
- All queries are organization-scoped.

## Tests

`tests/test_journey_chat_connection_manager.py` covers room-scoped broadcast,
dead-socket cleanup, and disconnect.
