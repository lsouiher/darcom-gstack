# Hetzner VPS Deployment Guide

Production deployment guide for DaryWin on Hetzner Cloud.

**Server**: `ubuntu-4gb-nbg1-4` | **Domain**: `darywin.com` | **Repo**: `/opt/darywin`

---

## Table of Contents

1. [Remaining Setup: Domain + HTTPS](#1-remaining-setup-domain--https)
2. [Remaining Setup: GitHub Deploy Workflow](#2-remaining-setup-github-deploy-workflow)
3. [Remaining Setup: Services to Configure](#3-remaining-setup-services-to-configure)
4. [Deploying Updates](#4-deploying-updates)
5. [Daily Commands Reference](#5-daily-commands-reference)
6. [Troubleshooting](#6-troubleshooting)
7. [Initial Setup Reference](#7-initial-setup-reference)

---

## 1. Remaining Setup: Domain + HTTPS

### Point DNS to your server

Go to your domain registrar's DNS settings and add these **A records**:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `YOUR_SERVER_IP` | Auto |
| A | `www` | `YOUR_SERVER_IP` | Auto |
| A | `api` | `YOUR_SERVER_IP` | Auto |
| A | `admin` | `YOUR_SERVER_IP` | Auto |

Verify DNS propagation:
```bash
ping darywin.com
```
When it shows your server IP, DNS is ready (can take minutes to hours).

### Install and configure Caddy

Caddy is a web server that automatically gets free SSL certificates from Let's Encrypt.

```bash
# Install Caddy
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy
```

```bash
# Configure reverse proxy
nano /etc/caddy/Caddyfile
```

Replace the entire contents with:
```
darywin.com, www.darywin.com {
    reverse_proxy localhost:8081
}

admin.darywin.com {
    reverse_proxy localhost:3003
}

api.darywin.com {
    reverse_proxy localhost:4004
}
```

```bash
# Start Caddy
systemctl reload caddy
systemctl status caddy
```

Your app will be live at:
- `https://darywin.com` -- Customer frontend
- `https://admin.darywin.com` -- Admin panel
- `https://api.darywin.com` -- Backend API

> **After Caddy is running**: Your `.env.docker` files already use `https://` URLs, so no rebuild needed.

---

## 2. Remaining Setup: GitHub Deploy Workflow

The repo has a `deploy` workflow (`.github/workflows/deploy.yml`) that deploys via SSH. To enable it:

1. Generate a deploy key on your local machine:
   ```bash
   ssh-keygen -t ed25519 -f ~/.ssh/hetzner_deploy -C "github-deploy"
   ```

2. Copy the public key to your server:
   ```bash
   ssh-copy-id -i ~/.ssh/hetzner_deploy.pub root@YOUR_SERVER_IP
   ```

3. Add secrets in GitHub repo **Settings > Secrets and variables > Actions**:
   - `VPS_HOST`: Your Hetzner server IP
   - `VPS_SSH_KEY`: Contents of `~/.ssh/hetzner_deploy` (the private key)

4. Deploy from GitHub: **Actions** tab > **deploy** > **Run workflow** > choose target (all/backend/frontend/admin)

---

## 3. Remaining Setup: Services to Configure

These are optional -- the app runs without them, but features will be limited.

| Service | What it enables | Where to get keys | Env vars to set |
|---------|----------------|-------------------|-----------------|
| **SendGrid** (SMTP) | Email notifications, password reset | sendgrid.com | `DW_SMTP_PASS` in `backend/.env.docker` |
| **Stripe** | Card payments | stripe.com/dashboard > Developers > API keys | `DW_STRIPE_SECRET_KEY` (backend), `VITE_DW_STRIPE_PUBLISHABLE_KEY` (frontend) |
| **PayPal** | PayPal payments | developer.paypal.com | `DW_PAYPAL_CLIENT_ID`, `DW_PAYPAL_CLIENT_SECRET` (backend) + set `DW_PAYPAL_SANDBOX=false` |
| **reCAPTCHA** | Bot prevention on forms | google.com/recaptcha (v2) | `DW_RECAPTCHA_SECRET` (backend), `VITE_DW_RECAPTCHA_SITE_KEY` (frontend) + set `VITE_DW_RECAPTCHA_ENABLED=true` |
| **Sentry** | Error monitoring | sentry.io | `DW_ENABLE_SENTRY=true`, `DW_SENTRY_DSN_BACKEND` (backend) |

After updating any env file, rebuild:
```bash
cd /opt/darywin && docker compose up -d --build
```

---

## 4. Deploying Updates

### Option A: From GitHub (recommended once set up)

Go to GitHub > **Actions** > **deploy** > **Run workflow**

### Option B: Manual via SSH

```bash
ssh root@YOUR_SERVER_IP
cd /opt/darywin
git pull origin main
docker compose up -d --build
```

### Rebuild a single service (faster)

```bash
docker compose up -d --build dw-backend    # backend only
docker compose up -d --build dw-frontend   # frontend only
docker compose up -d --build dw-admin      # admin only
```

---

## 5. Daily Commands Reference

### Connect to server
```bash
ssh root@YOUR_SERVER_IP
```

### Check container status
```bash
cd /opt/darywin && docker compose ps
```

### View logs
```bash
docker compose logs -f                  # all services
docker compose logs -f dw-backend       # backend only
docker compose logs -f dw-frontend      # frontend only
```

### Restart services
```bash
docker compose restart dw-backend       # restart one
docker compose down && docker compose up -d   # restart all
```

### Stop everything
```bash
docker compose down
```
> **Never** use `docker compose down -v` -- the `-v` flag deletes all data including the database.

### Check server resources
```bash
df -h           # disk space
free -h         # memory
docker system df   # docker disk usage
```

### Access MongoDB shell
```bash
docker exec -it darcom-mongo-1 mongosh -u darywin_admin -p YOUR_MONGO_PASSWORD
```

### View Caddy logs
```bash
journalctl -u caddy -f
```

### Clean up disk space
```bash
docker system prune -f          # remove unused images/containers
docker builder prune -f         # remove build cache
```

### Update server OS
```bash
apt update && apt upgrade -y
```

### Add swap (if out of memory)
```bash
bash /opt/darywin/__scripts/swap.sh
```

---

## 6. Troubleshooting

**Containers won't start**
```bash
docker compose logs dw-backend
```
Usually caused by wrong values in `.env.docker` files.

**Frontend shows blank page**
Check `VITE_DW_API_HOST` in `frontend/.env.docker` points to the correct API URL. Rebuild after changing.

**SSL certificate not working**
```bash
systemctl status caddy
journalctl -u caddy -f
```
Make sure DNS A records point to the right IP.

**Out of memory during build**
```bash
bash /opt/darywin/__scripts/swap.sh
```
Then retry.

**"Port already in use"**
```bash
lsof -i :4004
kill -9 PID
```

**Containers not running after server reboot**
```bash
cd /opt/darywin && docker compose up -d
```

**Can't git pull (authentication)**
Set the remote with your PAT token:
```bash
git remote set-url origin https://lsouiher:YOUR_TOKEN@github.com/lsouiher/darcom.git
```

---

## 7. Initial Setup Reference

> These steps are already completed. Kept here for reference if you need to set up a new server.

<details>
<summary>Click to expand initial setup steps</summary>

### SSH into server
```bash
ssh root@YOUR_SERVER_IP
```

### Install Docker
```bash
curl -fsSL https://get.docker.com | sh
```

### Clone the repo
```bash
git clone https://YOUR_TOKEN@github.com/lsouiher/darcom.git /opt/darywin
cd /opt/darywin
chmod +x -R /opt/darywin/__scripts
```

### Create MongoDB credentials
```bash
nano /opt/darywin/.env
```
```env
MONGO_USER=darywin_admin
MONGO_PASSWORD=<openssl rand -hex 24>
```

### Create backend env
```bash
cp backend/.env.docker.example backend/.env.docker
nano backend/.env.docker
```
Key values: `DW_DB_URI` (match MongoDB creds), `DW_COOKIE_SECRET`, `DW_JWT_SECRET` (generate with `openssl rand -hex 32`), domain hosts, SMTP config.

### Create frontend + admin env
```bash
cp frontend/.env.docker.example frontend/.env.docker
sed -i 's|http://localhost:4004|https://api.darywin.com|g' frontend/.env.docker

cp admin/.env.docker.example admin/.env.docker
sed -i 's|http://localhost:4004|https://api.darywin.com|g' admin/.env.docker
```

### Build and start
```bash
docker compose up -d --build
```

</details>
