# Raahi - Enterprise Commute & Carpooling Platform

A scalable, secure, and intelligent platform revolutionizing corporate commuting through optimized carpooling, integrated wallets, and seamless enterprise administration.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Setup Instructions](#setup-instructions)

---

## Problem Statement

Daily corporate commutes are plagued by high carbon footprints, severe traffic congestion, escalating transportation costs, and disjointed mobility solutions. Organizations lack a unified, secure, and sustainable platform to facilitate intra-company ride-sharing, track environmental impact, and manage employee transit efficiently, while employees struggle with the friction of coordinating rides and sharing costs securely with colleagues.

---

## Solution Overview

Raahi is a comprehensive, enterprise-grade carpooling and commute management ecosystem. It seamlessly connects employees for secure ride-sharing while providing organizations with powerful administration and analytics tools. 

By integrating a robust, asynchronous backend architecture with progressive web applications and conversational AI (WhatsApp), Raahi offers end-to-end journey coordination. The platform intelligently matches routes using Google Maps, facilitates frictionless cost-sharing via an integrated digital wallet, and ensures a native-like mobile experience through a responsive PWA, all wrapped in a highly modular, domain-driven design.

---

## Architecture

Raahi is structured as a scalable monorepo comprising distinct, specialized applications:

*   **Backend Application:** A high-performance, asynchronous REST API built with Python, FastAPI, and SQLAlchemy, backed by a PostgreSQL database. It utilizes a modular, domain-driven design strictly separating core business contexts such as identity management, ride coordination, payment processing, wallets, and journey chat.
*   **Employee Progressive Web App (PWA):** A responsive, mobile-first frontend built with React, TypeScript, and Vite. It features offline capabilities, dynamic map rendering, robust state management via Recoil, and modern styling with Tailwind CSS.
*   **Administration Portal:** A dedicated React-based web interface empowering organization administrators to manage enterprise users, monitor platform health, oversee verifications, and extract actionable commute analytics.
*   **WhatsApp Server:** A Node.js and Express-based microservice enabling conversational interfaces. It allows users to query rides, receive instant journey updates, and interact with the platform directly via WhatsApp.
*   **Google Maps Platform:** Deep integration for precise real-time routing, geocoding, distance matrix calculations, and optimized ride-matching algorithms to minimize detours.

---

## Key Features

*   **Intelligent Ride Matching:** Proprietary routing logic leveraging Google Maps APIs to pair riders with drivers based on real-time route proximity, acceptable time deviations, and seat availability.
*   **Enterprise Security & Identity:** Secure JWT-based authentication, role-based access control (RBAC), and mandatory corporate email verification ensuring a trusted network of verified employees.
*   **Integrated Digital Wallet & Payments:** A seamless virtual wallet system coupled with payment gateway integration, automating the cost-sharing process without external friction.
*   **Real-time Journey Chat & Notifications:** Context-aware, in-app messaging tied to specific journeys, supported by real-time notification dispatch across web and WhatsApp channels.
*   **Admin Dashboard & Analytics:** A comprehensive control center for system administrators to manage corporate entities, enforce compliance, and visualize platform utilization.
*   **Omnichannel Accessibility:** Engineered as a Progressive Web App (PWA) for seamless App Store-like installation on mobile devices, complemented by a WhatsApp bot for rapid interactions on the go.

---

## Tech Stack

*   **Backend Ecosystem:** Python, FastAPI, SQLAlchemy (Async), Pydantic, PostgreSQL, Uvicorn, Pytest.
*   **Frontend Ecosystem (PWA & Admin):** React, TypeScript, Vite, Recoil (Global State), React Router DOM, Tailwind CSS.
*   **External APIs & Integrations:** Google Maps Platform (Routing, Geocoding, Places), Payment Gateway Provider APIs, WhatsApp Business API.
*   **Microservices & Tooling:** Node.js, Express.js (WhatsApp Bot), Prettier, ESLint, PostCSS.

---

## Live Demo & Deployment

The application is deployed live on a custom home server running a Linux distribution. It utilizes **Cloudflare Tunnels** combined with an internal **NGINX reverse proxy** to securely route traffic to the domain:

🔗 **Live Website**: [https://raahi.d14.app](https://raahi.d14.app)

*Note: Raahi is a mobile-first Progressive Web App (PWA). You can install it directly to your device's home screen via your mobile browser for a native app-like experience.*

---

## Setup Instructions

We utilize Docker Compose to orchestrate the entire stack. We designed a minimal API configuration to support seamless local development without complex host configurations or CORS issues.

### Prerequisites
*   Docker Engine & Docker Compose (v2)
*   Google Maps API Key (with Maps JS, Directions, and Distance Matrix enabled)
*   Razorpay API Keys

### 1. Environment Configuration
Create a `.env` file at the root of the project by copying the example file:
```bash
cp .env.example .env
```
Populate the `.env` file with your specific API keys.

### 2. Local Development (Docker Compose)
To spin up the entire ecosystem (PostgreSQL, Backend, Admin Portal, Employee PWA, WhatsApp Sidecar, and NGINX Reverse Proxy) simultaneously:

```bash
docker-compose up --build
```

The applications will be automatically exposed via the NGINX proxy on `http://localhost`:
*   **Static Landing Page**: `http://localhost/`
*   **Employee PWA**: `http://localhost/app/`
*   **Admin Portal**: `http://localhost/admin/`
*   **Backend API**: `http://localhost/api/`
*   **API Documentation (Swagger)**: `http://localhost/docs`

### 3. Home Server Deployment Architecture
For our live home server deployment on Linux, the stack is orchestrated using the same Docker Compose configuration, but exposed securely to the internet:
1. **NGINX** acts as the internal reverse proxy routing path-based traffic (`/app/`, `/api/`, etc.) to the respective Docker containers.
2. A **Cloudflare `cloudflared` Tunnel** connects the Linux home server securely to the Cloudflare edge network.
3. Traffic to `raahi.d14.app` is encrypted via Cloudflare's edge SSL and tunneled directly into the internal NGINX container, completely bypassing the need for port forwarding or exposing the home server's public IP address.
