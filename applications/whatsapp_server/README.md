# Raahi WhatsApp Server

Node.js bridge for WhatsApp Web. It owns QR login, WhatsApp session persistence, duplicate prevention, and forwarding messages to `applications/agent_server`.

Run locally:

```powershell
cd applications\whatsapp_server
npm install
copy .env.example .env
npm start
```

Scan the QR code printed in the terminal.

Health:

- `GET /health`
- `GET /ready`

Welcome message endpoint for future backend login/signup hooks:

- `POST /internal/send-welcome-message`
- Header: `X-WhatsApp-Notification-Key`
- Body: `{ "phoneNumber": "+919876543210", "displayName": "Priya", "eventName": "login" }`

WhatsApp auth data is stored by `whatsapp-web.js` under `.wwebjs_auth` and must not be committed.
