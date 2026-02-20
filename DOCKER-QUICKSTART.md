# Docker Quick Start (Testing Only)

Fastest way to get the app running locally via Docker Desktop.

## Setup

```bash
# 1. Copy env files
cp backend/.env.docker.example backend/.env.docker && \
cp frontend/.env.docker.example frontend/.env.docker && \
cp admin/.env.docker.example admin/.env.docker

# 2. Set secrets in backend/.env.docker
#    Replace DW_JWT_SECRET and DW_COOKIE_SECRET with random strings:
#    openssl rand -hex 32

# 3. Start everything
docker-compose -f docker-compose.dev.yml up -d

# 4. Seed the database (wait ~30s for containers to be ready)
docker-compose -f docker-compose.dev.yml exec dw-dev-backend npm run setup
```

## Access

| App | URL | Login |
|-----|-----|-------|
| Frontend | http://localhost:8081 | jdoe@darywin.com / M00vinin |
| Admin | http://localhost:3003 | admin@darywin.com / M00vinin |
| API | http://localhost:4004 | - |
| MongoDB UI | http://localhost:8084 | admin / admin |

## Daily Use

```bash
# Start
docker-compose -f docker-compose.dev.yml up -d

# Stop
docker-compose -f docker-compose.dev.yml down

# Logs (specific service)
docker-compose -f docker-compose.dev.yml logs -f dw-dev-backend

# Fresh start (wipes DB and uploads)
docker-compose -f docker-compose.dev.yml down -v
```

Hot reload is enabled -- code changes reflect automatically in all services.
