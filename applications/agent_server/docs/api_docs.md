# API Docs

## Agent server

`POST /api/v1/chat`

Headers:

- `X-Internal-API-Key`

Body:

```json
{
  "whatsapp_id": "919876543210@c.us",
  "phone_number": "+919876543210",
  "message_id": "unique-message-id",
  "message": "Show my latest trip",
  "timestamp": "2026-07-18T12:00:00Z"
}
```

Response:

```json
{
  "success": true,
  "reply": "Safe user-facing response",
  "classification": "DATABASE_QUERY",
  "authenticated": true,
  "error_code": null
}
```

## WhatsApp server

`POST /internal/send-welcome-message`

Headers:

- `X-WhatsApp-Notification-Key`

Body:

```json
{
  "phoneNumber": "+919876543210",
  "displayName": "Priya",
  "eventName": "login"
}
```
