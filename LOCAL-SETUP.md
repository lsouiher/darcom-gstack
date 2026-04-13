# Local Development Setup Guide

This guide walks you through running DaryWin locally using Docker Desktop (no MongoDB installation required).

## Prerequisites

- **Docker Desktop** installed and running
- **Git** (to clone the repository)

No Node.js or MongoDB installation needed - everything runs in containers.

## Quick Start

### 1. Create Environment Files

Copy the example environment files. **Run all commands from the project root directory** (where `docker-compose.dev.yml` is located):

```bash
# Make sure you're in the project root
cd /path/to/darywin

# Copy all three environment files (run these from the project root)
cp backend/.env.docker.example backend/.env.docker
cp frontend/.env.docker.example frontend/.env.docker
cp admin/.env.docker.example admin/.env.docker
```

Or as a single command:

```bash
cp backend/.env.docker.example backend/.env.docker && \
cp frontend/.env.docker.example frontend/.env.docker && \
cp admin/.env.docker.example admin/.env.docker
```

**Windows PowerShell alternative:**

```powershell
Copy-Item backend\.env.docker.example backend\.env.docker
Copy-Item frontend\.env.docker.example frontend\.env.docker
Copy-Item admin\.env.docker.example admin\.env.docker
```

### 2. Configure Backend Secrets

Edit `backend/.env.docker` and replace the placeholder values:

```bash
DW_JWT_SECRET=your-secure-jwt-secret-key-here
DW_COOKIE_SECRET=your-secure-cookie-secret-here
```

Generate secure random strings for these values (e.g., use `openssl rand -hex 32`).

### 3. Start All Services

```bash
docker-compose -f docker-compose.dev.yml up -d
```

First run will take a few minutes to download images and build containers.

### 4. Initialize the Database

Once services are running, seed the database:

```bash
docker-compose -f docker-compose.dev.yml exec dw-dev-backend npm run setup
```

This creates a default admin account:
- **Email:** admin@darywin.com
- **Password:** M00vinin

### 5. Access the Applications

| Application | URL |
|-------------|-----|
| Frontend (Customer) | http://localhost:8091 |
| Admin Panel | http://localhost:3013 |
| Backend API | http://localhost:4005 |
| MongoDB Web UI | http://localhost:8085 |

> Host ports differ from the `darcom` parent repo so both projects can run in Docker Desktop at the same time. See **Running alongside darcom** below.

## Services Overview

Docker Compose starts 5 services:

| Service | Description | Host Port |
|---------|-------------|-----------|
| mongo | MongoDB database | 27019 |
| mongo-express | Database admin UI | 8085 |
| dw-dev-backend | Node.js/Express API | 4005 |
| dw-dev-admin | React admin panel | 3013 |
| dw-dev-frontend | React customer app | 8091 (HTTPS 8445) |

## Common Commands

### View logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f dw-dev-backend
```

### Stop services

```bash
docker-compose -f docker-compose.dev.yml down
```

### Stop and remove all data (fresh start)

```bash
docker-compose -f docker-compose.dev.yml down -v
```

### Restart a specific service

```bash
docker-compose -f docker-compose.dev.yml restart dw-dev-backend
```

### Rebuild containers (after Dockerfile changes)

```bash
docker-compose -f docker-compose.dev.yml up -d --build
```

## Environment Configuration

### Backend (`backend/.env.docker`)

Key settings already configured for Docker:

| Variable | Default | Description |
|----------|---------|-------------|
| DW_DB_URI | `mongodb://admin:admin@mongo:27017/darywin` | MongoDB connection |
| DW_PORT | 4004 | API port |
| DW_ADMIN_HOST | `http://localhost:3013/` | Admin panel URL |
| DW_FRONTEND_HOST | `http://localhost:8091/` | Frontend URL |

**Required secrets to set:**
- `DW_JWT_SECRET` - JWT signing key
- `DW_COOKIE_SECRET` - Cookie encryption key

**Optional (for full functionality):**
- `DW_STRIPE_SECRET_KEY` - Stripe payments
- `DW_PAYPAL_CLIENT_ID` / `DW_PAYPAL_CLIENT_SECRET` - PayPal payments
- `DW_SMTP_PASS` - Email service (SendGrid)
- `DW_RECAPTCHA_SECRET` - reCAPTCHA verification

### Frontend (`frontend/.env.docker`)

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_DW_API_HOST | `http://localhost:4005` | Backend API URL |
| VITE_PORT | 8081 | Dev server port (inside container; host maps to 8091) |
| VITE_DW_PAYMENT_GATEWAY | Stripe | Payment provider |

### Admin (`admin/.env.docker`)

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_DW_API_HOST | `http://localhost:4005` | Backend API URL |
| VITE_PORT | 3003 | Dev server port (inside container; host maps to 3013) |

## Hot Reload

All services support hot reload:

- **Backend**: Uses nodemon - changes to `.ts` files auto-restart the server
- **Frontend/Admin**: Vite watches for changes with polling enabled

Changes to source files should reflect automatically without restarting containers.

## Accessing MongoDB

### Via Mongo Express (Web UI)

Open http://localhost:8085 in your browser:
- **Username:** admin
- **Password:** admin

### Via MongoDB Client

Connect to `mongodb://admin:admin@127.0.0.1:27019/darywin`

## Running the Mobile App

The mobile app is NOT included in Docker Compose. To run it:

1. Install Node.js locally
2. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```
3. Create environment file:
   ```bash
   cp .env.example .env
   ```
4. Update `mobile/.env`:
   ```
   DW_API_HOST=http://YOUR_LOCAL_IP:4005
   ```
   (Use your machine's IP, not localhost, for device access)
5. Start Expo:
   ```bash
   npm run start
   ```

## Running alongside darcom

This fork uses a different host-port set from its parent repo (`darcom`) so both stacks can run in Docker Desktop at the same time without colliding:

| Service | darcom | darcom-gstack |
|---------|--------|---------------|
| mongo | 27018 | **27019** |
| mongo-express | 8084 | **8085** |
| backend | 4004 | **4005** |
| admin | 3003 | **3013** |
| frontend | 8081 / 8444 | **8091 / 8445** |

Services use `restart: unless-stopped`, so containers recover from crashes but do **not** auto-start when Docker Desktop launches after an explicit `down`. That gives you full control:

```bash
# Start this project
docker-compose -f docker-compose.dev.yml up -d

# Stop this project (keeps data in volumes)
docker-compose -f docker-compose.dev.yml down
```

You can have both darcom and darcom-gstack up simultaneously. If you prefer to run only one at a time, just `down` the other first.

## Troubleshooting

### Port already in use

```bash
# Stop all containers first
docker-compose -f docker-compose.dev.yml down

# Check what's using the port (e.g., 4005)
# Windows: netstat -ano | findstr :4005
# Linux/Mac: lsof -i :4005
```

### MongoDB connection failed

Check if mongo service is healthy:
```bash
docker-compose -f docker-compose.dev.yml ps
docker-compose -f docker-compose.dev.yml logs mongo
```

### Backend can't connect to MongoDB

The backend waits for MongoDB but may start before it's fully ready. Restart it:
```bash
docker-compose -f docker-compose.dev.yml restart dw-dev-backend
```

### Changes not reflecting

1. Check container logs for errors
2. For frontend/admin, hard refresh the browser (Ctrl+Shift+R)
3. Restart the specific service if needed

### Permission denied errors (Linux)

Docker volumes may have permission issues. Try:
```bash
sudo chown -R $USER:$USER .
```

### Containers keep restarting

Check logs for the failing container:
```bash
docker-compose -f docker-compose.dev.yml logs dw-dev-backend
```

Common causes:
- Missing or invalid environment variables
- Database connection issues
- Port conflicts

## File Storage

Uploaded files (avatars, property images) are stored in a Docker volume named `cdn`. This persists across container restarts but is removed with `docker-compose down -v`.

## Next Steps

1. Log into the admin panel at http://localhost:3013 with the default credentials
2. Create agencies, locations, and properties
3. Test the customer frontend at http://localhost:8091
4. Check the API at http://localhost:4005/api/docs (if Swagger is enabled)

## Useful Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project README](./README.md)
- [Contributing Guide](.github/CONTRIBUTING.md)
