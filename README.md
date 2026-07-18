# Raahi — Enterprise Carpooling Platform

An enterprise carpooling platform that helps organizations reduce commute costs, fuel consumption, and carbon emissions through shared rides.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI · SQLAlchemy 2.x · Pydantic v2 · PostgreSQL · JWT |
| **Frontend** | React 19 · Vite · TypeScript · Tailwind CSS v4 · TanStack Query · Recharts |
| **Database** | PostgreSQL 16 |
| **Deployment** | Docker Compose · NGINX |

---

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone and enter the project
cd raahi

# Copy environment variables
cp .env.example .env

# Build and start all services
docker compose up --build
```

Services will be available at:
- **Admin Portal**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Swagger Docs**: http://localhost:8000/docs

### Option 2: Run Separately (Development)

**Backend:**
```bash
cd applications/backend_application
pip install -r requirements.txt
uvicorn source.application_startup.main:app --reload
```

**Admin portal frontend:**
```bash
cd applications/web_administration_portal
npm install
npm run dev
```

**Employee PWA:**
```bash
cd applications/web_employee_progressive_application
npm install
npm run dev
```

**WhatsApp outbound sidecar** (only needed to actually deliver WhatsApp
notifications; the backend runs fine without it and logs messages instead):
```bash
cd applications/whatsapp_server
cp .env.example .env          # set WHATSAPP_NOTIFICATION_API_KEY
npm install
npm start
# On first run it prints a QR code in the terminal — scan it from
# WhatsApp → Linked Devices. The session is saved for next time.
```
Then set `WHATSAPP_ENABLED=true`, `WHATSAPP_SERVICE_URL=http://localhost:8090`,
and a matching `WHATSAPP_NOTIFICATION_API_KEY` in the backend `.env`.

---

## Payments, Chat & Notifications

These enterprise features build on the ride flow in the employee PWA:

- **Payments & Wallet** — passengers pay a completed ride's fare by Cash, Card,
  UPI, or Wallet; every payment credits the driver's wallet. Card/UPI go through
  Razorpay Checkout, verified server-side. Wallet recharge also uses Razorpay.
  Configure `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` (backend) and
  `VITE_RAZORPAY_KEY_ID` (employee PWA). Point a Razorpay webhook at
  `POST /api/v1/payments/razorpay/webhook` and set `RAZORPAY_WEBHOOK_SECRET`.
- **Journey chat** — a WebSocket group chat per journey (driver + accepted
  passengers) at `/api/v1/ws/journeys/{ride_offer_id}/chat`, with a `tel:` call
  button. No extra service required.
- **Email** — temporary-password/welcome and payment emails via SMTP. Set
  `EMAIL_ENABLED=true` plus the `SMTP_*` / `EMAIL_FROM_*` vars (e.g. a Gmail app
  password or Mailtrap). With `EMAIL_ENABLED=false` emails are logged, not sent.
- **WhatsApp ride notifications + 15-minute reminders** — fired at each ride
  lifecycle transition and by an in-process scheduler shortly before departure.
  Both email and WhatsApp sends are best-effort: a channel failure is logged and
  never blocks or rolls back a ride/payment.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://raahi_user:raahi_secret@localhost:5432/raahi` |
| `POSTGRES_USER` | Docker PostgreSQL user | `raahi_user` |
| `POSTGRES_PASSWORD` | Docker PostgreSQL password | `raahi_secret` |
| `POSTGRES_DB` | Docker PostgreSQL database | `raahi` |
| `JWT_SECRET` | Secret key for JWT signing | `change-this-to-a-random-secret-in-production` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRATION_MINUTES` | Access token TTL | `30` |
| `JWT_REFRESH_TOKEN_EXPIRATION_DAYS` | Refresh token TTL | `7` |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `API_URL` | Backend API base URL | `http://localhost:8000` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | *(empty)* |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay credentials (payments + wallet) | *(empty)* |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signing secret | *(empty)* |
| `EMAIL_ENABLED` | Send email over SMTP (else log-only) | `false` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USERNAME` / `SMTP_PASSWORD` | SMTP delivery settings | *(empty)* / `587` |
| `WHATSAPP_ENABLED` | Send WhatsApp via the sidecar (else log-only) | `false` |
| `WHATSAPP_SERVICE_URL` | WhatsApp sidecar base URL | `http://localhost:8090` |
| `WHATSAPP_NOTIFICATION_API_KEY` | Shared key between backend and sidecar | *(empty)* |

### Using External PostgreSQL

Set `DATABASE_URL` to your external database and omit the Docker PostgreSQL service:

```bash
DATABASE_URL=postgresql://user:password@your-host:5432/raahi docker compose up backend_application web_administration_portal
```

---

## Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@raahi.com` | `admin123` | Company Admin |

Demo data (15 employees, 8 vehicles, 50 trips) is seeded automatically on first startup.

---

## Project Structure

```
raahi/
├── applications/
│   ├── backend_application/           # FastAPI backend
│   │   └── source/
│   │       ├── application_startup/   # App config, DB, main.py
│   │       ├── shared_infrastructure/ # Base models, auth, pagination
│   │       ├── modules/
│   │       │   ├── administrator_authentication/
│   │       │   ├── organization_management/
│   │       │   ├── employee_management/
│   │       │   ├── vehicle_management/
│   │       │   ├── trip_statistics/
│   │       │   ├── company_settings/
│   │       │   ├── administrator_profile/
│   │       │   └── dashboard_statistics/
│   │       └── database_seed/
│   │
│   └── web_administration_portal/     # React frontend
│       └── source/
│           ├── features/
│           │   ├── administrator_login/
│           │   ├── dashboard_overview/
│           │   ├── employee_management/
│           │   ├── vehicle_management/
│           │   ├── reports_and_analytics/
│           │   ├── company_settings/
│           │   └── administrator_profile/
│           └── shared_user_interface_infrastructure/
│               ├── backend_communication/
│               ├── authentication_state/
│               ├── protected_route/
│               ├── layout/
│               └── reusable_components/
│
├── docker-compose.yml
├── nginx.conf
├── .env.example
├── .gitignore
└── README.md
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1/`.

| Module | Endpoints |
|--------|-----------|
| **Authentication** | `POST /login` · `POST /refresh` · `GET /me` |
| **Dashboard** | `GET /dashboard/statistics` |
| **Employees** | `GET` · `POST` · `GET /:id` · `PUT /:id` · `PATCH /:id/activate` · `PATCH /:id/deactivate` · `DELETE /:id` |
| **Vehicles** | `GET` · `POST` · `GET /:id` · `PUT /:id` · `DELETE /:id` |
| **Trips** | `GET` · `GET /summary` · `GET /monthly` |
| **Settings** | `GET` · `PUT` |
| **Organization** | `GET /current` · `PUT /current` |
| **Profile** | `GET` · `PUT` · `POST /change-password` |
| **Payments** | `POST /payments/razorpay/orders` · `POST /payments/razorpay/verify` · `POST /payments/bookings/:id/pay` · `GET /payments/my-payments` · `GET /payments/:id` · `POST /payments/razorpay/webhook` |
| **Wallet** | `GET /wallet` · `GET /wallet/transactions` · `POST /wallet/recharge/orders` · `POST /wallet/recharge/verify` |
| **Journey Chat** | `WS /ws/journeys/:ride_offer_id/chat` · `GET /journeys/:ride_offer_id/messages` |

Full API documentation: http://localhost:8000/docs

---

## Roles

| Role | Access |
|------|--------|
| `SUPER_ADMIN` | Platform-level access (future) |
| `COMPANY_ADMIN` | Full organization access (implemented) |
| `EMPLOYEE` | Employee mobile app access (future) |

---

## Multi-Tenancy

Every business entity is scoped to an `organization_id`. Data never leaks between organizations.

---

## Deployment

For production:
1. Set strong `JWT_SECRET` and `POSTGRES_PASSWORD` values
2. Use the included `nginx.conf` as a reverse proxy
3. Build frontend: `cd applications/web_administration_portal && npm run build`
4. Serve the built frontend via NGINX
5. Run backend behind NGINX: `uvicorn source.application_startup.main:app --host 0.0.0.0 --port 8000`

---

## License

Built for hackathon demonstration purposes.
