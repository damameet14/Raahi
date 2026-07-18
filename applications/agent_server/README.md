# Raahi Agent Server

FastAPI service that receives WhatsApp chat requests, resolves Raahi users, enforces role-aware read-only database access, retrieves local knowledge-base documents, and stores chatbot memory/audit records in a separate SQLite database.

Run locally:

```powershell
cd applications\agent_server
python -m venv venv
venv\Scripts\pip install -r requirements.txt
copy .env.example .env
venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Health:

- `GET /health`
- `GET /ready`

Chat endpoint:

- `POST /api/v1/chat` with `X-Internal-API-Key`.

The ERP database connection is read-only by convention and all tools are allow-listed. For production, use a PostgreSQL user with only `SELECT` permissions.
