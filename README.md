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

**Frontend:**
```bash
cd applications/web_administration_portal
npm install
npm run dev
```

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
