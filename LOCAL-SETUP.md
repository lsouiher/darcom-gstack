# Local Development Setup Guide

This guide walks you through running Movin' In locally using Docker Desktop (no MongoDB installation required).

## Prerequisites

- **Docker Desktop** installed and running
- **Git** (to clone the repository)

No Node.js or MongoDB installation needed - everything runs in containers.

## Quick Start

### 1. Create Environment Files

Copy the example environment files. **Run all commands from the project root directory** (where `docker-compose.dev.yml` is located):

```bash
# Make sure you're in the project root
cd /path/to/movinin

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
MI_JWT_SECRET=your-secure-jwt-secret-key-here
MI_COOKIE_SECRET=your-secure-cookie-secret-here
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
docker-compose -f docker-compose.dev.yml exec mi-dev-backend npm run setup
```

This creates a default admin account:
- **Email:** admin@movinin.io
- **Password:** M00vinin

### 5. Access the Applications

| Application | URL |
|-------------|-----|
| Frontend (Customer) | http://localhost:8081 |
| Admin Panel | http://localhost:3003 |
| Backend API | http://localhost:4004 |
| MongoDB Web UI | http://localhost:8084 |

## Services Overview

Docker Compose starts 5 services:

| Service | Description | Port |
|---------|-------------|------|
| mongo | MongoDB database | 27018 |
| mongo-express | Database admin UI | 8084 |
| mi-dev-backend | Node.js/Express API | 4004 |
| mi-dev-admin | React admin panel | 3003 |
| mi-dev-frontend | React customer app | 8081 |

## Common Commands

### View logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f mi-dev-backend
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
docker-compose -f docker-compose.dev.yml restart mi-dev-backend
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
| MI_DB_URI | `mongodb://admin:admin@mongo:27017/movinin` | MongoDB connection |
| MI_PORT | 4004 | API port |
| MI_ADMIN_HOST | `http://localhost:3003/` | Admin panel URL |
| MI_FRONTEND_HOST | `http://localhost:8081/` | Frontend URL |

**Required secrets to set:**
- `MI_JWT_SECRET` - JWT signing key
- `MI_COOKIE_SECRET` - Cookie encryption key

**Optional (for full functionality):**
- `MI_STRIPE_SECRET_KEY` - Stripe payments
- `MI_PAYPAL_CLIENT_ID` / `MI_PAYPAL_CLIENT_SECRET` - PayPal payments
- `MI_SMTP_PASS` - Email service (SendGrid)
- `MI_RECAPTCHA_SECRET` - reCAPTCHA verification

### Frontend (`frontend/.env.docker`)

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_MI_API_HOST | `http://localhost:4004` | Backend API URL |
| VITE_PORT | 8081 | Dev server port |
| VITE_MI_PAYMENT_GATEWAY | Stripe | Payment provider |

### Admin (`admin/.env.docker`)

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_MI_API_HOST | `http://localhost:4004` | Backend API URL |
| VITE_PORT | 3003 | Dev server port |

## Hot Reload

All services support hot reload:

- **Backend**: Uses nodemon - changes to `.ts` files auto-restart the server
- **Frontend/Admin**: Vite watches for changes with polling enabled

Changes to source files should reflect automatically without restarting containers.

## Accessing MongoDB

### Via Mongo Express (Web UI)

Open http://localhost:8084 in your browser:
- **Username:** admin
- **Password:** admin

### Via MongoDB Client

Connect to `mongodb://admin:admin@127.0.0.1:27018/movinin`

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
   MI_API_HOST=http://YOUR_LOCAL_IP:4004
   ```
   (Use your machine's IP, not localhost, for device access)
5. Start Expo:
   ```bash
   npm run start
   ```

## Troubleshooting

### Port already in use

```bash
# Stop all containers first
docker-compose -f docker-compose.dev.yml down

# Check what's using the port (e.g., 4004)
# Windows: netstat -ano | findstr :4004
# Linux/Mac: lsof -i :4004
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
docker-compose -f docker-compose.dev.yml restart mi-dev-backend
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
docker-compose -f docker-compose.dev.yml logs mi-dev-backend
```

Common causes:
- Missing or invalid environment variables
- Database connection issues
- Port conflicts

## File Storage

Uploaded files (avatars, property images) are stored in a Docker volume named `cdn`. This persists across container restarts but is removed with `docker-compose down -v`.

## Next Steps

1. Log into the admin panel at http://localhost:3003 with the default credentials
2. Create agencies, locations, and properties
3. Test the customer frontend at http://localhost:8081
4. Check the API at http://localhost:4004/api/docs (if Swagger is enabled)

## Useful Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Project README](./README.md)
- [Contributing Guide](.github/CONTRIBUTING.md)
