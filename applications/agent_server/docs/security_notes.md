# Security Notes

- The WhatsApp bridge calls the agent through `X-Internal-API-Key`.
- The agent does not expose prompts, SQL, traces, stack traces, or document chunks to WhatsApp.
- Database tools are allow-listed and parameterized.
- Guest users cannot access ERP database answers.
- Employees are filtered by `employee_id` and `organization_id`.
- Company admins are filtered by `organization_id`.
- WhatsApp signup/login welcome messages are exposed as an endpoint for future backend hooks; the current backend is not modified.
- Use a PostgreSQL read-only user for `ERP_DATABASE_URL` in production.
