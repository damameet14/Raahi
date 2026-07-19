# Deployment Architecture

## Executive Summary
Raahi utilizes a unified Docker Compose orchestration strategy that intentionally doubles as both a seamless local development environment and a viable single-node deployment target. 

The deployment philosophy focuses on extreme simplicity and developer ergonomics. By routing all external traffic (frontend applications, backend APIs, and static marketing assets) through a central NGINX reverse proxy on a single unified hostname (`raahi.d14.app`), the architecture completely eliminates Cross-Origin Resource Sharing (CORS) complexities and allows a single wildcard TLS certificate to secure the entire platform effortlessly.

**Production Readiness Status**: The current implementation defined in `docker-compose.yml` is geared heavily towards rapid prototyping and development (e.g., utilizing Vite development servers and Uvicorn). Significant architectural hardening is required before it can be considered enterprise production-ready.

---

# Deployment Overview

```mermaid
graph TD
    Browser[Web Browser / Mobile Client]
    
    subgraph Docker Host
        Nginx[NGINX Reverse Proxy :80]
        
        Nginx -->|/| Static[Static Landing Assets]
        Nginx -->|/app/| EmpPWA[Employee PWA :5174]
        Nginx -->|/admin/| AdminPWA[Admin Portal :5173]
        Nginx -->|/api/| API[FastAPI Backend :8000]
        
        API -->|TCP 5432| DB[(PostgreSQL :5432)]
        API -->|HTTP 8090| WhatsApp[WhatsApp Sidecar :8090]
    end
    
    API -.->|REST| Maps[Google Maps API]
    API -.->|REST / Webhooks| Razorpay[Razorpay Gateway]
    API -.->|SMTP| Email[SMTP Email Provider]
```

---

# Infrastructure Components

| Component | Technology | Purpose | Deployment Target | Dependencies |
| :--- | :--- | :--- | :--- | :--- |
| **Reverse Proxy** | NGINX (Alpine) | Single-origin path routing, static file serving, and WebSocket upgrading. | Docker Container | All internal services |
| **Backend API** | FastAPI (Python 3) | Core business logic, validation, and database orchestration. | Docker Container | PostgreSQL, External APIs |
| **Database** | PostgreSQL 16 | Persistent relational data storage. | Docker Container | None |
| **WhatsApp Sidecar**| Node.js / `whatsapp-web.js` | Headless WhatsApp client for outbound transactional notifications. | Docker Container | None |
| **Admin Portal** | React / Vite | Organization administration interface. | Docker Container | Proxied to Backend |
| **Employee PWA** | React / Vite | Core end-user application for ride discovery and management. | Docker Container | Proxied to Backend |

---

# Local Development

### Prerequisites
- Docker Engine & Docker Compose (v2)
- *Note: No local Node.js or Python installations are strictly required on the host machine, as the entire execution stack is isolated within containers.*

### Development Workflow
The repository utilizes a singular `docker-compose.yml` file to orchestrate the entire stack simultaneously.

**Startup Command**:
```bash
docker-compose up --build
```
*(To start the local database as well, append `--profile dev-db` if not relying on an external cloud database).*

- **Backend Startup**: The backend mounts the local `./applications/backend_application` directory as a volume and executes Uvicorn. Any Python code changes trigger an automatic hot-reload.
- **Frontend Startup**: Both Vite applications mount their respective local directories as volumes and execute `npm run dev -- --host 0.0.0.0`. Hot Module Replacement (HMR) is fully active out-of-the-box.
- **Routing**: Developers access the application locally via `http://localhost`, which structurally mimics the exact path definitions of the production NGINX configuration (`/app/`, `/api/`, etc.).

---

# Environment Variables

| Variable | Purpose | Required | Example | Security Notes |
| :--- | :--- | :---: | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string. | Yes | `postgresql://user:pass@host:5432/db` | Contains plain-text credentials. |
| `JWT_SECRET` | Cryptographic key for signing auth tokens. | Yes | `super_secret_string` | Must be a high-entropy securely generated string in production. |
| `GOOGLE_MAPS_API_KEY` | Used for detour calculation and PWA map rendering. | Yes | `AIzaSy...` | Restrict HTTP referrers directly in Google Cloud Console. |
| `RAZORPAY_KEY_ID` | Payment gateway public identifier. | Yes | `rzp_test_...` | Safe to expose to the frontend if required. |
| `RAZORPAY_KEY_SECRET` | Payment gateway private secret. | Yes | `secret_...` | **CRITICAL**: Never expose to frontend. |
| `SMTP_PASSWORD` | Credentials for outbound email. | No | `password123` | Store securely. |
| `WHATSAPP_ENABLED` | Feature flag to enable/disable the node sidecar. | No | `true` | N/A |

*(Note: Variables are injected centrally via a `.env` file at the repository root and passed down to containers via docker-compose interpolation).*

---

# Docker Deployment

The project heavily leverages Docker for infrastructure isolation and execution consistency.

- **Dockerfile**: Each application (`backend_application`, `web_administration_portal`, `web_employee_progressive_application`, `whatsapp_server`) contains its own localized `Dockerfile` handling internal dependency installation (`pip` or `npm`).
- **Docker Compose**: The root `docker-compose.yml` physically binds the stack together.
- **Networks**: Services communicate over the default Docker bridge network internally using container names (e.g., the NGINX proxy passes traffic to `http://backend_application:8000`).
- **Volumes**: 
  - `postgres_data`: Persists the PostgreSQL database bytes across container restarts and host reboots.
  - `whatsapp_session`: Persists the `.wwebjs_auth` session state so administrators do not have to rescan the WhatsApp QR code upon every deployment.
  - *Bind Mounts*: Source code directories are bind-mounted (`./:/application`) to strictly enable live-reloading during development.

---

# Database Deployment

- **Engine**: PostgreSQL 16 (Alpine minimal image).
- **Initialization**: Managed conditionally via the `dev-db` Docker Compose profile.
- **Migrations**: Alembic is utilized within the Python backend container to apply automated schema changes on startup.
- **Connection**: Managed via the standard `DATABASE_URL` environment variable.
- **Persistence**: A named Docker volume (`postgres_data`) ensures data survives container recreation.
- **Backup Strategy**: Not natively implemented in the `docker-compose.yml`; currently relies entirely on manual `pg_dump` execution or external cloud provider snapshots.

---

# Frontend Deployment

- **Framework**: React via Vite.
- **Current Status**: The frontend is explicitly executed using the Vite development server (`npm run dev -- --host 0.0.0.0`) inside Docker.
- **Configuration**: Uses NGINX path-based routing.
  - `/app/` -> Proxies to Employee PWA container
  - `/admin/` -> Proxies to Admin Portal container
- **API Connectivity**: Because the frontend physically shares the same domain origin as the backend via NGINX, no `VITE_API_URL` is hardcoded. Fetch calls natively resolve relatively to `/api/`, sidestepping CORS browser protections completely.
- **Static Assets**: The marketing landing page (`index.html`, `css/`, `js/`, `assets/`) is statically served directly by NGINX bypassing Node entirely.

---

# Backend Deployment

- **Runtime**: Python 3 (via FastAPI).
- **Entry Point**: `uvicorn source.application_startup.main:app --host 0.0.0.0 --port 8000`
- **Dependencies**: Installed directly into the container during the Docker build phase.
- **API Availability**: NGINX intercepts `/api/` traffic, rewrites the host headers, and proxies it to TCP port 8000 on the backend container.

---

# External Services

### Google Maps
- **Purpose**: Geocoding, Distance Matrix (detour calculation), and visual Directions rendering.
- **Configuration**: `GOOGLE_MAPS_API_KEY`.
- **Failure Handling**: If the API times out, ride matching fails gracefully returning an empty response array.

### Razorpay
- **Purpose**: Fiat currency processing for digital wallet top-ups.
- **Configuration**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- **Failure Handling**: Webhook signature verification failures drop the payload silently; top-ups remain uncredited until manual reconciliation.

### SMTP Email Provider
- **Purpose**: Outbound transactional emails (OTP, Registration confirmations).
- **Configuration**: Standard SMTP host, port, user, and password variables.

---

# Application Startup Sequence

```mermaid
sequenceDiagram
    participant DB as PostgreSQL
    participant Backend as FastAPI Backend
    participant Frontends as Vite Node Servers
    participant Nginx as NGINX Proxy
    
    DB->>DB: Initialize & Mount PostgreSQL Volume
    Backend->>DB: Wait for TCP 5432 Availability
    Backend->>Backend: Run Alembic Database Migrations
    Backend->>Backend: Start Uvicorn Server (Port 8000)
    Frontends->>Frontends: Run `npm run dev`
    Nginx->>Nginx: Mount nginx.conf & Static Files
    Nginx->>Backend: Reverse Proxy Ready
```

---

# Deployment Workflow

```mermaid
flowchart TD
    A[Code Commit / Push] --> B[Clone Repository to Target VM]
    B --> C[Configure .env secrets file]
    C --> D[Execute docker-compose up --build -d]
    D --> E[Docker Engine Builds Images]
    E --> F[Containers Start & Mount Volumes]
    F --> G[NGINX Exposes Port 80]
    G --> H[Application Ready to Serve]
```

---

# Scalability

- **Horizontal Scaling**: The backend is completely stateless (relying on PostgreSQL and stateless JWTs). It can be scaled easily to multiple replicas using `docker-compose up --scale backend_application=3`. NGINX will automatically round-robin traffic to the active replicas.
- **Database Scaling**: The `docker-compose.yml` single PostgreSQL instance is a severe bottleneck for production. The backend should be pointed at a highly-available managed cloud database (e.g., AWS RDS, GCP Cloud SQL) via the `DATABASE_URL`.
- **Frontend Scaling**: The current `npm run dev` architecture does not scale and leaks memory over time. For production, the Vite apps must be compiled to static HTML/JS/CSS bundles and served directly by an edge CDN or NGINX.

---

# Security

- **Single Origin (CORS)**: By routing everything through NGINX on `raahi.d14.app`, CORS is implicitly bypassed, drastically reducing the surface area for cross-site attacks.
- **Private Source Code**: NGINX explicitly only mounts the `index.html` and static asset folders as read-only volumes (`:ro`), ensuring `.git`, `.env`, and application source code are never accidentally exposed to the public web.
- **Environment Secrets**: Injected safely at runtime; passwords are not hardcoded or baked into Docker images.
- **HTTPS/TLS**: The current `nginx.conf` listens only on port 80 (HTTP). Production execution implicitly relies on an external load balancer (like an AWS ALB, DigitalOcean Load Balancer, or Cloudflare Proxy) to terminate TLS/SSL before securely forwarding traffic to NGINX on port 80.

---

# Monitoring & Logging

- **Current Logging**: Relies on native `stdout` / `stderr` streams captured directly by the Docker daemon (accessible via `docker logs`).
- **Health Checks**: A native healthcheck is implemented for PostgreSQL (`pg_isready`). NGINX will refuse to route traffic to the backend if the backend container crashes entirely.
- **Future Recommendations**: There is currently no active Application Performance Monitoring (APM). Integrating Datadog, Prometheus, or Sentry for granular exception tracking is highly recommended for production observability.

---

# Disaster Recovery

- **Current Status**: Relies entirely on the raw Docker Volume `postgres_data`. If the host VM is destroyed, all relational data is irrevocably lost.
- **Recovery Process**: In the event of a crash, running `docker-compose up -d` will restart the containers and automatically reattach them to the existing persistent volume.
- **Database Restoration**: Requires manual, hands-on execution of `pg_restore` directly against the running container.

---

# Production Readiness Assessment

| Area | Current Status | Ready? | Recommended Improvement |
| :--- | :--- | :---: | :--- |
| **Frontend** | Runs via `npm run dev` | ❌ No | Compile to static bundles (`npm run build`) and serve directly via NGINX or a CDN. |
| **Backend** | Runs via Uvicorn (single worker) | ⚠️ Partial | Use Gunicorn as a process manager with Uvicorn worker classes to utilize multiple CPU cores. |
| **Database** | Dockerized PostgreSQL Volume | ❌ No | Migrate to a managed cloud database (RDS/Cloud SQL) for automated snapshots and high availability. |
| **Security** | Secrets via `.env`, NGINX routing | ✅ Yes | Enforce TLS termination at the edge load balancer. |
| **Monitoring** | Raw Docker stdout logs | ❌ No | Implement structured JSON logging and integrate Sentry for exception tracking. |
| **CI/CD** | Manual `docker-compose` execution | ❌ No | Implement GitHub Actions to build and push immutable Docker images to a registry. |

---

# Future Improvements

To transform this repository from a highly ergonomic development environment into an enterprise-grade production architecture, the following deployment enhancements are strictly recommended:

1. **Multi-Stage Docker Builds**: Modify the frontend Dockerfiles to run `npm run build` and copy the resulting `dist/` artifacts into a lightweight NGINX Alpine image, abandoning the Vite development node server entirely for production.
2. **Managed Cloud Database**: Drop the `postgres_database` service from `docker-compose.yml` for production deployments and utilize AWS RDS for automated, point-in-time daily backups.
3. **Continuous Integration (CI/CD)**: Implement GitHub Actions to automatically run Pydantic unit tests, build the Docker images, and push them to a Container Registry upon every merge to `main`.
4. **Automated SSL/TLS**: Add a Certbot (Let's Encrypt) sidecar container to the `docker-compose.yml` to automatically provision and renew HTTPS certificates if deploying to a raw Virtual Machine rather than behind a cloud load balancer.
