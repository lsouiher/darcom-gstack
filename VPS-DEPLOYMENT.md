# VPS Deployment Cheatsheet

Quick reference for deploying changes to the Hetzner VPS.

**Server**: `ubuntu-4gb-nbg1-4` | **Domain**: `darywin.com` | **Repo**: `/opt/darywin`

---

## Deploy Workflow

```
local: make changes -> build docker -> test on localhost -> commit & push -> merge to main
  vps: ssh in -> git pull -> rebuild docker -> verify
```

### 1. Local: Build & Test

```bash
docker compose -f docker-compose.dev.yml up -d --build   # build & run locally
# test on localhost, then:
git add . && git commit && git push
# merge to main on GitHub
```

### 2. VPS: Pull & Rebuild

```bash
ssh root@YOUR_SERVER_IP
cd /opt/darywin
```

**Deploy everything:**
```bash
bash __scripts/dw-deploy.sh all
```

**Deploy a single service (faster):**
```bash
bash __scripts/dw-deploy.sh backend
bash __scripts/dw-deploy.sh frontend
bash __scripts/dw-deploy.sh admin
bash __scripts/dw-deploy.sh ui          # frontend + admin
```

**Or manually:**
```bash
git pull origin main
docker compose up -d --build                # rebuild all
docker compose up -d --build dw-backend     # rebuild one
```

### 3. Verify

```bash
docker compose ps                          # all containers running?
docker compose logs -f dw-backend          # check for errors
```

---

## Seed Production Data

Generate sample agencies and listings:

```bash
docker exec -it darcom-dw-backend-1 node dist/src/setup/seed-prod.js
```

Or from the host if backend is not running in Docker:
```bash
cd /opt/darywin/backend && npm run seed:prod
```

---

## Common Docker Ops

### Logs
```bash
docker compose logs -f                     # all services
docker compose logs -f dw-backend          # backend only
docker compose logs -f dw-frontend         # frontend only
docker compose logs --tail=100 dw-backend  # last 100 lines
```

### Restart
```bash
docker compose restart dw-backend          # restart one service
docker compose down && docker compose up -d   # restart all
```

### Stop
```bash
docker compose down
```
> **Never** use `docker compose down -v` -- the `-v` flag deletes the database volume.

### Cleanup (free disk space)
```bash
docker system prune -f           # unused images/containers
docker builder prune -f          # build cache
```

### MongoDB Shell
```bash
docker exec -it darcom-mongo-1 mongosh -u darywin_admin -p YOUR_MONGO_PASSWORD
```

### Server Resources
```bash
free -h                          # memory
df -h                            # disk
docker system df                 # docker disk usage
bash __scripts/swap.sh           # add swap if out of memory
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Container won't start | `docker compose logs dw-backend` -- usually bad `.env.docker` values |
| Out of memory during build | `bash __scripts/swap.sh` then retry |
| Blank page on frontend | Check `VITE_DW_API_HOST` in `frontend/.env.docker`, rebuild |
| SSL issues | `systemctl status caddy` / `journalctl -u caddy -f` |
| Containers down after reboot | `cd /opt/darywin && docker compose up -d` |
| Can't git pull | `git remote set-url origin https://lsouiher:YOUR_TOKEN@github.com/lsouiher/darcom.git` |
| Port in use | `lsof -i :4004` then `kill -9 PID` |
| Env var changed | Rebuild: `docker compose up -d --build` |
