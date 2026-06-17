# CROKED — Production Deployment Guide

This guide details how to deploy the **CROKED** Indian Stock Prediction Web App in production. 

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Environment Configuration & Secrets](#2-environment-configuration--secrets)
3. [Method A: VPS/VM Deployment with Docker Compose (Recommended)](#method-a-vpsvm-deployment-with-docker-compose-recommended)
4. [Method B: PaaS Split Deployment (Vercel + Render + Supabase)](#method-b-paas-split-deployment-vercel--render--supabase)
5. [Database Migrations & Tables Setup](#5-database-migrations--tables-setup)
6. [Automating Drift Updates (Cron Job)](#6-automating-drift-updates-cron-job)
7. [Security Hardening](#7-security-hardening)

---

## 1. Prerequisites
- Docker & Docker Compose installed on your host/server.
- Domain name (e.g., `croked.ai`) with DNS records pointed to your server's IP address.
- Angel One SmartAPI Developer Account (to obtain API keys and secrets).

---

## 2. Environment Configuration & Secrets

Copy `backend/.env.example` to `backend/.env` on your server and modify the variables.

### Required Backend Variables (`backend/.env`):
```env
# Server details
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=https://yourdomain.com,http://localhost:3000
RATE_LIMIT=60/minute

# Database
DATABASE_URL=postgresql://postgres:secure-password@db:5432/croked

# JWT Token Secret (GENERATE A SECURE RANDOM HEX STRING)
# Linux command to generate: openssl rand -hex 32
JWT_SECRET=your-secure-production-jwt-secret-string

# Angel One SmartAPI (Equities Live Quotes Feed)
ANGELONE_API_KEY=your_smartapi_api_key
ANGELONE_CLIENT_CODE=your_client_code_or_id
ANGELONE_PASSWORD=your_pin_or_password
ANGELONE_TOTP_SECRET=your_totp_secret_key

# Market News & Sentiment (Optional keys, falls back to Google News RSS)
ALPHA_VANTAGE_API_KEY=your_key
FINNHUB_API_KEY=your_key

# Email SMTP Setup (Optional, logs reset codes to console if empty)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-address@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=CROKED <your-address@gmail.com>
```

---

## Method A: VPS/VM Deployment with Docker Compose (Recommended)

This method sets up the database, backend, frontend, and an Nginx reverse proxy routing traffic correctly.

### Step 1: Clone and Configure
On your VPS, clone the repository and navigate to the directory:
```bash
git clone <your-git-repository-url>
cd CROKED
```
Create the `.env` file inside `backend/` as shown in [Environment Configuration](#2-environment-configuration--secrets).

### Step 2: Build & Start Containers
Use the production-optimized docker-compose file:
```bash
docker compose -f docker-compose.prod.yml up --build -d
```
This command:
1. Builds the Next.js frontend, setting `NEXT_PUBLIC_API_URL` to an empty string so the client uses relative paths pointing directly to the Nginx server.
2. Builds the FastAPI backend, checking database connectivity and automatically generating standard tables on startup.
3. Sets up Nginx listening on port 80 to proxy `/api/*` to FastAPI (port 8000) and all other requests (`/`) to Next.js (port 3000).

### Step 3: SSL Setup with Certbot & Let's Encrypt
To secure your production app with HTTPS:
1. Install Certbot on your host server:
   ```bash
   sudo apt-get update
   sudo apt-get install certbot python3-certbot-nginx -y
   ```
2. Request an SSL certificate for your domain:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```
   Follow the prompts. Certbot will automatically rewrite the host Nginx configuration (if Nginx is installed directly on the host) or you can copy the generated SSL certificates to map them into the Nginx container's volume (port 443).

---

## Method B: PaaS Split Deployment (Vercel + Render + Supabase)

If you prefer serverless hosting, you can split the layers.

### 1. Database (Supabase)
- Create a PostgreSQL database on [Supabase](https://supabase.com/).
- Retrieve the connection string (with PGBouncer pooling enabled if needed):
  `postgresql://postgres.xxx:password@aws-0-xx.pooler.supabase.com:6543/postgres?pgbouncer=true`

### 2. Backend API (Render / Railway)
- Deploy the `backend/` directory as a Web Service.
- Set the build command: `pip install -r requirements.txt`
- Set the start command: `uvicorn app.main:app --host 0.0.0.0 --port 8000`
- Inject all environment variables from your `backend/.env` into Render/Railway's dashboard.

### 3. Frontend Dashboard (Vercel / Netlify)
- Deploy the `frontend/` directory to Vercel.
- In Vercel's environment settings, configure:
  - `NEXT_PUBLIC_API_URL`: Set to your Render/Railway backend URL (e.g., `https://croked-api.onrender.com`).
- Build & Deploy.

---

## 5. Database Migrations & Tables Setup
When starting up the backend container, the application executes `Base.metadata.create_all(bind=engine)` inside its lifespan startup hooks.
This automatically creates the following tables if they do not exist:
- `users` (Relational credentials store)
- `watchlists` (User tracked stock selections)
- `prediction_drift` (Tracking predicted vs actual close prices to check model accuracy)

No manual migration tools (like Alembic) are strictly necessary to launch, but can be added if schema alterations are required.

---

## 6. Automating Drift Updates (Cron Job)
The ML prediction pipeline logs expected daily outcomes. To evaluate the actual market outcome and calculate model accuracy, you must periodically trigger the drift calculator.

Create a cron job on your host server to ping the `/api/monitoring/update` endpoint daily at market close (e.g., 4:00 PM IST):
```bash
# Edit cron jobs
crontab -e

# Add the following line (Triggers daily at 4:05 PM IST, Monday-Friday)
# Time is represented in UTC (10:35 AM UTC = 4:05 PM IST)
35 10 * * 1-5 curl -X POST "http://localhost/api/monitoring/update" -H "accept: application/json"
```

---

## 7. Security Hardening
- **Change Default Secrets:** Never run production with the default `JWT_SECRET`.
- **CORS Lockdowns:** Restrict the backend `CORS_ORIGINS` to the exact frontend domain name.
- **Port Exposure:** In `docker-compose.prod.yml`, the backend and Next.js ports are intentionally kept private to the docker network. Only Nginx's port `80` is exposed. Keep this structure to avoid bypassing proxy security.
