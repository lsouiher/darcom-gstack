# Hetzner VPS Deployment Guide

A step-by-step guide to deploy DaryWin on a Hetzner Cloud server. Written for first-time VPS users.

---

## Table of Contents

1. [Your Setup So Far](#1-your-setup-so-far)
2. [Find Your Server IP](#2-find-your-server-ip)
3. [Connect to Your Server (SSH)](#3-connect-to-your-server-ssh)
4. [Verify Docker is Installed](#4-verify-docker-is-installed)
5. [Clone the Repository](#5-clone-the-repository)
6. [Configure Environment Files](#6-configure-environment-files)
7. [Update docker-compose.yml](#7-update-docker-composeyml)
8. [Start the Application](#8-start-the-application)
9. [Point a Domain to Your Server](#9-point-a-domain-to-your-server)
10. [Set Up HTTPS with Caddy](#10-set-up-https-with-caddy)
11. [Future Deployments](#11-future-deployments)
12. [Common Tasks Reference](#12-common-tasks-reference)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Your Setup So Far

You already have:
- A Hetzner Cloud account
- A project with a server created
- Docker installed on the server

What's left: clone the repo, configure environment files, start Docker containers, and optionally set up a domain with HTTPS.

---

## 2. Find Your Server IP

1. Go to [console.hetzner.cloud](https://console.hetzner.cloud)
2. Click on your **project**
3. Click on your **server** name
4. Your **IPv4 address** is displayed at the top (e.g., `65.21.100.200`)

Write this IP down — you'll use it everywhere.

---

## 3. Connect to Your Server (SSH)

SSH is how you control your server from your local terminal. Every time you want to work on your server, you start here.

### From Windows (PowerShell or WSL)

```bash
ssh root@YOUR_SERVER_IP
```

Example:
```bash
ssh root@65.21.100.200
```

### First time connecting?

You'll see a message like:
```
The authenticity of host '65.21.100.200' can't be established.
Are you sure you want to continue connecting (yes/no)?
```
Type `yes` and press Enter. This only happens once per server.

### "Permission denied" or "Connection refused"?

This means SSH can't authenticate you. Here's how to fix it:

**Option A: You already have an SSH key and added it when creating the server**

Your key is probably at `~/.ssh/id_ed25519` or `~/.ssh/id_rsa`. Try:
```bash
ssh -i ~/.ssh/id_ed25519 root@YOUR_SERVER_IP
```

**Option B: You don't have an SSH key or didn't add one**

1. Generate a new key on your local machine:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
   Press Enter for all prompts (default location, no passphrase).

2. Copy your public key:
   ```bash
   # Windows (PowerShell)
   cat $env:USERPROFILE\.ssh\id_ed25519.pub

   # WSL / Mac / Linux
   cat ~/.ssh/id_ed25519.pub
   ```

3. Add it to your Hetzner server:
   - Go to [console.hetzner.cloud](https://console.hetzner.cloud)
   - Navigate to your **project** > **Security** > **SSH Keys**
   - Click **Add SSH Key**, paste your public key, give it a name
   - **Important**: Adding a key here only applies to *new* servers. For your existing server, use the Hetzner **web console** (see Option C) to add the key manually.

**Option C: Use Hetzner's web console as a fallback**

If SSH isn't working, you can access your server through the browser:
1. Go to [console.hetzner.cloud](https://console.hetzner.cloud)
2. Click your **server**
3. Click the **Console** tab (top-right area, looks like `>_`)
4. You're now logged in as root — no SSH key needed

From here you can add your SSH key manually:
```bash
mkdir -p ~/.ssh
echo "PASTE_YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Then SSH from your local machine should work.

**Option D: Reset root password**

As a last resort, Hetzner lets you reset the root password:
1. Go to your server in Hetzner Cloud console
2. Click **Rescue** tab > **Reset Root Password**
3. Use the password shown to log in: `ssh root@YOUR_SERVER_IP` (it will prompt for the password)
4. After logging in, add your SSH key as shown in Option C

### You're connected when you see

```
root@your-server-name:~#
```

This means you're inside your server. Every command you type now runs on the server, not on your local machine.

### To disconnect

Type `exit` or press `Ctrl+D`. You're back on your local machine.

---

## 4. Verify Docker is Installed

Once connected to your server via SSH, verify Docker is working:

```bash
docker --version
docker compose version
```

Both should print version numbers. If `docker compose` doesn't work, try `docker-compose --version` (with a hyphen). If neither works, install Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

---

## 5. Clone the Repository

The deploy scripts expect the project at `/opt/darywin`.

```bash
mkdir -p /opt/darywin
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git /opt/darywin
cd /opt/darywin
chmod +x -R /opt/darywin/__scripts
```

> **Private repo?** You need a GitHub Personal Access Token:
> 1. Go to GitHub > Settings > Developer Settings > Personal Access Tokens > Tokens (classic)
> 2. Generate a token with `repo` scope
> 3. Clone with: `git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git /opt/darywin`

If the repo is already cloned from a previous session, just pull the latest:
```bash
cd /opt/darywin
git pull
```

---

## 6. Configure Environment Files

You need three `.env.docker` files. Create them from the examples, then edit each one.

### How to edit files on the server

Use `nano` (a simple text editor):
- **Arrow keys** to move around
- **Type normally** to edit
- **Ctrl+O** then **Enter** to save
- **Ctrl+X** to exit

### Backend

```bash
cp /opt/darywin/backend/.env.docker.example /opt/darywin/backend/.env.docker
nano /opt/darywin/backend/.env.docker
```

Key values to set:

```env
NODE_ENV=production

# Your domain (or use http://YOUR_SERVER_IP:PORT if no domain yet)
DW_ADMIN_HOST=https://admin.yourdomain.com/
DW_FRONTEND_HOST=https://yourdomain.com/
DW_AUTH_COOKIE_DOMAIN=yourdomain.com

# Generate secrets — run this command twice on the server: openssl rand -hex 32
DW_COOKIE_SECRET=PASTE_FIRST_RANDOM_STRING
DW_JWT_SECRET=PASTE_SECOND_RANDOM_STRING

# Email (SMTP) — e.g., SendGrid, Mailgun, or Gmail app password
DW_SMTP_HOST=smtp.sendgrid.net
DW_SMTP_PORT=587
DW_SMTP_USER=apikey
DW_SMTP_PASS=YOUR_SMTP_PASSWORD
DW_SMTP_FROM=no-reply@yourdomain.com

# Stripe (from stripe.com dashboard > Developers > API keys)
DW_STRIPE_SECRET_KEY=sk_live_...

# PayPal (from developer.paypal.com)
DW_PAYPAL_SANDBOX=false
DW_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
DW_PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_CLIENT_SECRET

# reCAPTCHA (from google.com/recaptcha — use the SECRET key here)
DW_RECAPTCHA_SECRET=YOUR_RECAPTCHA_SECRET

# Admin email and site name
DW_ADMIN_EMAIL=admin@yourdomain.com
DW_WEBSITE_NAME="Your App Name"
DW_TIMEZONE=UTC
```

To generate secrets:
```bash
openssl rand -hex 32
```
Run it twice — once for `DW_COOKIE_SECRET`, once for `DW_JWT_SECRET`.

### Frontend

```bash
cp /opt/darywin/frontend/.env.docker.example /opt/darywin/frontend/.env.docker
nano /opt/darywin/frontend/.env.docker
```

Key values to set:

```env
VITE_NODE_ENV=production

# Your domain (or http://YOUR_SERVER_IP:4004 if no domain yet)
VITE_DW_API_HOST=https://api.yourdomain.com
VITE_DW_CDN_USERS=https://api.yourdomain.com/cdn/darywin/users
VITE_DW_CDN_PROPERTIES=https://api.yourdomain.com/cdn/darywin/properties
VITE_DW_CDN_LOCATIONS=https://api.yourdomain.com/cdn/darywin/locations

# Stripe publishable key (starts with pk_live_)
VITE_DW_STRIPE_PUBLISHABLE_KEY=pk_live_...

# PayPal client ID
VITE_DW_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID

# reCAPTCHA (use the SITE key here, not the secret)
VITE_DW_RECAPTCHA_ENABLED=true
VITE_DW_RECAPTCHA_SITE_KEY=YOUR_RECAPTCHA_SITE_KEY

# Your info
VITE_DW_CONTACT_EMAIL=info@yourdomain.com
VITE_DW_WEBSITE_NAME="Your App Name"

# Map default center (Algiers, Algeria)
VITE_DW_MAP_LATITUDE=36.7538
VITE_DW_MAP_LONGITUDE=3.0588
VITE_DW_MAP_ZOOM=6
```

### Admin Panel

```bash
cp /opt/darywin/admin/.env.docker.example /opt/darywin/admin/.env.docker
nano /opt/darywin/admin/.env.docker
```

Key values to set:

```env
VITE_NODE_ENV=production

# Your domain (or http://YOUR_SERVER_IP:4004 if no domain yet)
VITE_DW_API_HOST=https://api.yourdomain.com
VITE_DW_CDN_USERS=https://api.yourdomain.com/cdn/darywin/users
VITE_DW_CDN_TEMP_USERS=https://api.yourdomain.com/cdn/darywin/temp/users
VITE_DW_CDN_PROPERTIES=https://api.yourdomain.com/cdn/darywin/properties
VITE_DW_CDN_TEMP_PROPERTIES=https://api.yourdomain.com/cdn/darywin/temp/properties
VITE_DW_CDN_LOCATIONS=https://api.yourdomain.com/cdn/darywin/locations
VITE_DW_CDN_TEMP_LOCATIONS=https://api.yourdomain.com/cdn/darywin/temp/locations

VITE_DW_WEBSITE_NAME="Your App Name"
VITE_DW_CONTACT_EMAIL=info@yourdomain.com
```

---

## 7. Update docker-compose.yml

Change the default MongoDB credentials (never use `admin/admin` in production):

```bash
nano /opt/darywin/docker-compose.yml
```

Change these values (pick a strong password):
```yaml
MONGO_INITDB_ROOT_USERNAME: admin        # change this
MONGO_INITDB_ROOT_PASSWORD: admin        # CHANGE THIS — use a strong password
```

Also update `ME_CONFIG_MONGODB_URL` to match:
```yaml
ME_CONFIG_MONGODB_URL: mongodb://YOUR_NEW_USER:YOUR_NEW_PASS@mongo:27017/
```

And update your `backend/.env.docker` to match:
```env
DW_DB_URI="mongodb://YOUR_NEW_USER:YOUR_NEW_PASS@mongo:27017/darywin?authSource=admin&appName=darywin"
```

---

## 8. Start the Application

```bash
cd /opt/darywin

# Build and start all containers (takes 5-10 minutes the first time)
docker compose up -d --build

# Watch logs to verify everything started
docker compose logs -f
```

Press `Ctrl+C` to stop watching logs (containers keep running in the background).

Check that all containers are running:
```bash
docker compose ps
```

You should see all services with status `Up`:
- `mongo`
- `mongo-express`
- `dw-backend`
- `dw-admin`
- `dw-frontend`

Your app is now accessible at:
- Frontend: `http://YOUR_SERVER_IP:8081`
- Admin: `http://YOUR_SERVER_IP:3003`
- API: `http://YOUR_SERVER_IP:4004`
- MongoDB UI: `http://YOUR_SERVER_IP:8084`

---

## 9. Point a Domain to Your Server

> Skip this if you don't have a domain yet. You can test with the IP address.

1. Buy a domain (Namecheap, Cloudflare, GoDaddy, etc.)
2. Go to the domain's **DNS settings**
3. Add these **A records** pointing to your Hetzner server IP:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `YOUR_SERVER_IP` | Auto |
| A | `www` | `YOUR_SERVER_IP` | Auto |
| A | `api` | `YOUR_SERVER_IP` | Auto |
| A | `admin` | `YOUR_SERVER_IP` | Auto |

DNS changes can take a few minutes to a few hours to propagate. You can check with:
```bash
# Run this on your local machine
ping yourdomain.com
```
When it shows your server IP, DNS is ready.

---

## 10. Set Up HTTPS with Caddy

Caddy is a web server that automatically gets free SSL certificates. It sits in front of your Docker containers and handles HTTPS.

### Install Caddy (run on your server)

```bash
apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy
```

### Configure Caddy

```bash
nano /etc/caddy/Caddyfile
```

Replace the entire contents with (use your real domains):

```
yourdomain.com, www.yourdomain.com {
    reverse_proxy localhost:8081
}

admin.yourdomain.com {
    reverse_proxy localhost:3003
}

api.yourdomain.com {
    reverse_proxy localhost:4004
}
```

### Start Caddy

```bash
systemctl reload caddy
systemctl status caddy
```

Caddy automatically requests SSL certificates from Let's Encrypt. Your app is now live at:
- `https://yourdomain.com` — Customer frontend
- `https://admin.yourdomain.com` — Admin panel
- `https://api.yourdomain.com` — Backend API

> **Important**: After setting up HTTPS, go back and update all `DW_*_HOST` and `VITE_DW_API_HOST` values in your `.env.docker` files to use `https://` URLs, then rebuild:
> ```bash
> cd /opt/darywin && docker compose up -d --build
> ```

---

## 11. Future Deployments

After pushing code changes to GitHub, deploy to your server:

```bash
# 1. SSH into your server
ssh root@YOUR_SERVER_IP

# 2. Deploy
/opt/darywin/__scripts/dw-deploy.sh all         # everything
/opt/darywin/__scripts/dw-deploy.sh backend      # backend only
/opt/darywin/__scripts/dw-deploy.sh ui           # admin + frontend
/opt/darywin/__scripts/dw-deploy.sh frontend     # frontend only
/opt/darywin/__scripts/dw-deploy.sh admin        # admin only
```

---

## 12. Common Tasks Reference

### Reconnecting to your server
```bash
ssh root@YOUR_SERVER_IP
```

### Checking what's running
```bash
cd /opt/darywin
docker compose ps
```

### Viewing logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f dw-backend
```

### Restarting services
```bash
# Restart one service
docker compose restart dw-backend

# Restart everything
docker compose down && docker compose up -d
```

### Stopping everything
```bash
docker compose down
```

> **Warning**: `docker compose down -v` deletes all data including the database. Don't use `-v` unless you want a fresh start.

### Checking server resources
```bash
# Disk space
df -h

# Memory
free -h

# Docker disk usage
docker system df
```

### Accessing MongoDB shell
```bash
docker exec -it darcom-mongo-1 mongosh -u YOUR_MONGO_USER -p YOUR_MONGO_PASSWORD
```

### Adding swap space (if you run out of memory)
```bash
/opt/darywin/__scripts/swap.sh
```

### Viewing Caddy (HTTPS) logs
```bash
journalctl -u caddy -f
```

### Updating the server OS
```bash
apt update && apt upgrade -y
```

---

## 13. Troubleshooting

**Can't SSH into the server**
- Double-check the IP at [console.hetzner.cloud](https://console.hetzner.cloud)
- Use Hetzner's web console as a fallback (server page > Console tab)
- Reset root password if needed (server page > Rescue tab)
- Make sure your local firewall isn't blocking port 22

**Containers won't start**
```bash
docker compose logs dw-backend
```
Usually caused by missing or wrong values in `.env.docker` files.

**Frontend shows blank page**
Check that `VITE_DW_API_HOST` in `frontend/.env.docker` points to the correct API URL. Rebuild after changing: `docker compose up -d --build`

**SSL certificate not working**
- Make sure DNS A records point to the right IP
- Check Caddy status: `systemctl status caddy`
- Check Caddy logs: `journalctl -u caddy -f`

**Out of memory during build**
```bash
/opt/darywin/__scripts/swap.sh
```
Then retry the build.

**"Port already in use" error**
Something else is using the port. Find and stop it:
```bash
lsof -i :4004    # replace 4004 with the conflicting port
kill -9 PID      # replace PID with the process ID shown
```

**Server rebooted and containers are not running**
Docker containers with `restart: always` should auto-start. If they didn't:
```bash
cd /opt/darywin
docker compose up -d
```
