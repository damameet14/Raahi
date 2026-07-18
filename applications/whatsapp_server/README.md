# Raahi WhatsApp Server

Outbound WhatsApp sender for Raahi ride notifications, built on
`whatsapp-web.js`. It owns the WhatsApp Web session (QR login) and exposes a
single internal HTTP endpoint the FastAPI backend calls to push messages
(booking confirmations, journey updates, cancellations, and 15-minute
pre-ride reminders). It does **not** receive or reply to messages.

## Run locally

```powershell
cd applications\whatsapp_server
npm install
copy .env.example .env   # set WHATSAPP_NOTIFICATION_API_KEY to match the backend
npm start
```

Scan the QR code printed in the terminal with the phone that will send the
notifications. Session data is stored under `.wwebjs_auth` and must not be
committed.

## Endpoints

- `GET /health` — liveness + WhatsApp client state.
- `POST /internal/send-message` — send one message.
  - Header: `X-WhatsApp-Notification-Key: <WHATSAPP_NOTIFICATION_API_KEY>`
  - Body: `{ "phoneNumber": "+919876543210", "message": "..." }`

The backend must set `WHATSAPP_ENABLED=true`, `WHATSAPP_SERVICE_URL`, and a
matching `WHATSAPP_NOTIFICATION_API_KEY` for messages to be sent; otherwise it
logs them instead.
