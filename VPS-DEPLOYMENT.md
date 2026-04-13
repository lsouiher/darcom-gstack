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

## Host Signup — Twilio Verify (OTP)

The public host signup flow (`/become-a-host` → `/signup/host`) requires Twilio Verify to deliver OTPs. Without these vars, signup fails with `SERVICE_UNAVAILABLE`.

### 1. Create a Twilio Verify Service

1. Sign in to [console.twilio.com](https://console.twilio.com).
2. **Verify → Services → Create new**. Name it `DaryWin`. Copy the **Service SID** (starts with `VA…`).
3. Copy **Account SID** (`AC…`) and **Auth Token** from the console home.
4. For WhatsApp: **Verify → Service → Channels → WhatsApp**, enable it, and complete sender/template registration with Meta. Until approved, keep `DW_TWILIO_WHATSAPP_ENABLED=false` and rely on SMS only.

### 2. Set env vars on the VPS

Edit `/opt/darywin/backend/.env.docker` and add:

```
# Twilio Verify
DW_TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DW_TWILIO_AUTH_TOKEN=your_twilio_auth_token
DW_TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DW_TWILIO_WHATSAPP_ENABLED=false        # flip to true once WhatsApp sender is approved

# Host signup — Algeria launch
DW_SIGNUP_ALLOWED_COUNTRY_CODES=DZ
DW_SIGNUP_PUBLIC_ENABLED=true
DW_SIGNUP_SESSION_SECRET=<random 32+ bytes>
DW_AUDIT_PEPPER=<random 32+ bytes>

# MUST stay false in production
DW_SMS_DEV_MODE=false
```

Generate strong secrets: `openssl rand -hex 32`.

### 3. Rebuild backend

```bash
cd /opt/darywin
bash __scripts/dw-deploy.sh backend
docker compose logs -f dw-backend | grep -i twilio
```

### 4. Verify end-to-end

1. Open `https://darywin.com/become-a-host` → start wizard with a real DZ number (`+213…`).
2. Confirm OTP arrives by SMS (or WhatsApp if enabled).
3. Complete wizard → lands in admin portal as an active agency.

### Kill switch

Disable public signup without a deploy: set `DW_SIGNUP_PUBLIC_ENABLED=false` and `docker compose restart dw-backend`. Admin-provisioned agency creation is unaffected.

### Troubleshooting

| Symptom | Cause / fix |
|---------|-------------|
| "Service unavailable" on SEND CODE | Twilio creds missing/wrong — check `dw-backend` logs for `[smsProvider]` |
| "Country not supported yet" | Phone country not in `DW_SIGNUP_ALLOWED_COUNTRY_CODES` |
| "An error occurred." on a real number | Not E.164 (`+213…`), or `libphonenumber` flagged it invalid |
| WhatsApp never delivers, SMS does | WhatsApp sender not approved — set `DW_TWILIO_WHATSAPP_ENABLED=false` until Meta approves |
| Cost spike | Check Twilio Verify usage; Twilio charges per attempt |

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

## SMTP / Email

The backend sends account-activation, password-reset, and notification emails via SMTP. Without valid credentials, **signup fails** — the user record is deleted if the verification email can't be sent (see `userController.ts` `_signup`).

### Prod: SendGrid

Default config in `backend/.env.docker.example` targets SendGrid. Free tier = 100 emails/day.

1. Create a SendGrid account at https://sendgrid.com.
2. **Sender Verification** (required, or sends are rejected):
   - Settings → Sender Authentication → Single Sender Verification → add `no-reply@darywin.com` (or your chosen `DW_SMTP_FROM`) and click the verification link sent to that mailbox.
   - For production volume, prefer Domain Authentication (adds SPF/DKIM DNS records for `darywin.com`).
3. **API Key**: Settings → API Keys → Create API Key → "Restricted Access" with only "Mail Send" enabled. Copy the key (shown once).
4. On the VPS, edit `/opt/darywin/backend/.env.docker`:
   ```
   DW_SMTP_HOST=smtp.sendgrid.net
   DW_SMTP_PORT=587
   DW_SMTP_USER=apikey          # literal string "apikey" — SendGrid convention
   DW_SMTP_PASS=SG.xxxxx...     # the API key you just created
   DW_SMTP_FROM=no-reply@darywin.com
   ```
5. Rebuild backend: `bash __scripts/dw-deploy.sh backend` (or `docker compose up -d --build dw-backend`).
6. Verify: register a test account on the site and confirm the activation email arrives. If not, check `docker logs darcom-dw-backend-1 | grep -i smtp`.

### Local dev: MailHog

Local dev uses MailHog (bundled in `docker-compose.dev.yml`) — no external account needed. All outbound mail is captured; inspect it at **http://localhost:8026**.

`backend/.env.docker` ships with MailHog defaults (`DW_SMTP_HOST=mailhog`, `PORT=1025`, empty user/pass). Nothing to configure.

### Alternate providers

Any SMTP provider works (Mailgun, Postmark, AWS SES, Gmail app password). Set `DW_SMTP_HOST`, `DW_SMTP_PORT`, `DW_SMTP_USER`, `DW_SMTP_PASS` accordingly. Leave `DW_SMTP_USER` empty to disable auth (MailHog-style).

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
| Signup fails with `SMTP_ERROR` / `535 Authentication failed` | SendGrid API key invalid/revoked or sender not verified — see "SMTP / Email" section |
