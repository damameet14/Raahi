# WhatsApp AI Agent Integration

## Repository analysis summary

The current Raahi project is an enterprise carpooling platform. The existing backend is FastAPI + SQLAlchemy + PostgreSQL. The frontend is React + Vite. Roles are `SUPER_ADMIN`, `COMPANY_ADMIN`, and `EMPLOYEE`. Current ERP-like modules include organizations, authentication, employees, vehicles, trips, company settings, dashboard/report statistics, and payment processing on this branch.

## Architecture

```text
WhatsApp User
  -> applications/whatsapp_server
  -> applications/agent_server
  -> read-only Raahi PostgreSQL tools
  -> chatbot SQLite memory/audit database
  -> local role-aware knowledge documents
```

## Machine-readable integration

```yaml
whatsapp_agent_integration:
  whatsapp_service: "applications/whatsapp_server"
  agent_service: "applications/agent_server"
  chat_endpoint: "applications/agent_server/app/main.py::process_chat_message"
  whatsapp_forwarder: "applications/whatsapp_server/src/services/agentClient.js::AgentServerClient.sendChatMessage"
  welcome_message_endpoint: "applications/whatsapp_server/src/index.js::POST /internal/send-welcome-message"
  database_tools: "applications/agent_server/app/database_tools.py"
  memory_store: "applications/agent_server/app/memory.py"
  rag_service: "applications/agent_server/app/rag_service.py"
  audit_logger: "applications/agent_server/app/audit.py"
```

## Welcome messages on signup/login

The prompt requested WhatsApp messages when a user signs up or logs in. To respect the prompt constraint not to modify the existing backend/frontend, the WhatsApp server exposes:

```text
POST /internal/send-welcome-message
```

The backend can call this endpoint after signup/login with `X-WhatsApp-Notification-Key`.

## Run commands

Agent:

```powershell
cd applications\agent_server
python -m venv venv
venv\Scripts\pip install -r requirements.txt
copy .env.example .env
venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

WhatsApp:

```powershell
cd applications\whatsapp_server
npm install
copy .env.example .env
npm start
```

Then scan the QR code printed by `whatsapp-web.js`.

## Known hackathon limitations

- The RAG service is file-backed for a reliable demo and includes FAISS/LangChain dependencies for upgrade.
- Authentication maps WhatsApp users by registered email or phone number. It does not ask for passwords over WhatsApp.
- Existing backend login/signup is not modified; welcome notification is ready as an internal endpoint.
- Use a read-only PostgreSQL account in production.
