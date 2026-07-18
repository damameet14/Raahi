# WhatsApp Agent System Design

## Current project analysis

Raahi is an enterprise carpooling ERP-like platform. The existing backend is FastAPI with SQLAlchemy and PostgreSQL. The existing roles are `SUPER_ADMIN`, `COMPANY_ADMIN`, and `EMPLOYEE`. Business tables include organizations, user accounts, employees, vehicles, trips, company settings, and payment records on the current integration branch.

## Architecture

WhatsApp messages flow through `applications/whatsapp_server`, then into this FastAPI agent server. The agent server owns authentication sessions, read-only database tools, local document retrieval, short-term messages, long-term safe memories, and audit events.

## Supported demo flows

- Guest introduction.
- Guest protected-request denial.
- Login by existing Raahi email or phone number.
- Admin organization summary.
- Employee personal vehicle/trip summary.
- Latest accessible trip lookup.
- Local markdown knowledge-base retrieval.

## Limitations

The implementation provides LangChain/LangGraph-compatible provider boundaries but uses deterministic routing for reliable hackathon demos. Add real model calls inside the existing factory and chat orchestration boundaries when model credentials are configured.
