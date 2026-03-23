# VPS Deployment Guide

This guide walks you through deploying DaryWin on a VPS (Virtual Private Server) — a remote Linux machine in the cloud that runs your application 24/7. No prior server experience required.

---

## Table of Contents

1. [What is a VPS?](#1-what-is-a-vps)
2. [Choose a Hosting Provider](#2-choose-a-hosting-provider)
3. [Create Your Server](#3-create-your-server)
4. [Connect to Your Server](#4-connect-to-your-server)
5. [Install Docker](#5-install-docker)
6. [Clone the Repository](#6-clone-the-repository)
7. [Configure Environment Files](#7-configure-environment-files)
8. [Update docker-compose.yml](#8-update-docker-composeyml)
9. [Start the Application](#9-start-the-application)
10. [Point a Domain to Your Server](#10-point-a-domain-to-your-server)
11. [Set Up HTTPS with Caddy](#11-set-up-https-with-caddy)
12. [Future Deployments](#12-future-deployments)
13. [Useful Commands](#13-useful-commands)

---

## 1. What is a VPS?

A VPS is a virtual machine rented from a cloud provider. Think of it as a computer in a data center that:
- Runs Linux 24/7
- Has a public IP address anyone can reach
- Costs $5–15/month depending on size

You control it entirely through a terminal (SSH).

---

## 2. Choose a Hosting Provider

Any of these work well. Hetzner is the best value for money:

| Provider | Monthly Cost | Notes |
|---|---|---|
| **Hetzner** | ~$4–6/mo | Best price/performance, EU & US regions |
| DigitalOcean | ~$6–12/mo | Very beginner-friendly UI |
| Linode (Akamai) | ~$5–10/mo | Reliable, good documentation |
| AWS EC2 | Varies | More complex, overkill for most setups |

**Recommended specs** for a small-to-medium deployment:
- **CPU**: 2 vCPUs
- **RAM**: 4 GB (minimum), 8 GB preferred
- **Storage**: 40 GB SSD
- **OS**: Ubuntu 24.04 LTS

---

## 3. Create Your Server

### On Hetzner (recommended)

1. Sign up at [hetzner.com/cloud](https://www.hetzner.com/cloud)
2. Click **New Project** → give it a name
3. Click **Add Server**:
   - **Location**: choose closest to your users
   - **Image**: Ubuntu 24.04
   - **Type**: CX22 (2 vCPU / 4 GB RAM) — ~$4.15/mo
   - **SSH Key**: click "Add SSH key" (see below)
4. Click **Create & Buy Now**

### On DigitalOcean

1. Sign up at [digitalocean.com](https://www.digitalocean.com)
2. Click **Create** → **Droplets**
3. Choose **Ubuntu 24.04**, **Basic** plan, **Regular** CPU, **$6/mo** (1 GB) or **$12/mo** (2 GB)
4. Add your SSH key (see below)
5. Click **Create Droplet**

### Generate an SSH Key (do this on your local machine)

Open a terminal (PowerShell on Windows, Terminal on Mac/Linux):

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

Press Enter for all prompts (default file, no passphrase is fine for personal use).

Then copy your public key:
```bash
# Windows (PowerShell)
cat $env:USERPROFILE\.ssh\id_ed25519.pub

# Mac/Linux
cat ~/.ssh/id_ed25519.pub
```

Paste this value into the "SSH Key" field on your hosting provider.

---

## 4. Connect to Your Server

Once your server is created, you'll see its **IP address** (e.g., `65.21.100.200`).

```bash
ssh root@YOUR_SERVER_IP
```

Example:
```bash
ssh root@65.21.100.200
```

Type `yes` when asked about the fingerprint. You are now inside your server.

---

## 5. Install Docker

Run these commands on your server one by one:

```bash
# Update package list
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh

# Verify Docker is running
docker --version
docker compose version
```

Both commands should print version numbers. Docker Compose is included with modern Docker installs.

---

## 6. Clone the Repository

Your deploy scripts expect the project at `/opt/darywin`. Clone it there:

```bash
# Create the directory
mkdir -p /opt/darywin

# Clone your GitHub repo (replace with your actual repo URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git /opt/darywin

# Go into the project
cd /opt/darywin

# Make all scripts executable
chmod +x -R /opt/darywin/__scripts
```

> If your repository is **private**, you'll need to authenticate. The easiest way:
> 1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
> 2. Generate a token with `repo` scope
> 3. Use it in the clone URL: `https://YOUR_TOKEN@github.com/YOUR_USERNAME/YOUR_REPO.git`

---

## 7. Configure Environment Files

You need to create three `.env.docker` files from the provided examples.

### Backend

```bash
cp /opt/darywin/backend/.env.docker.example /opt/darywin/backend/.env.docker
nano /opt/darywin/backend/.env.docker
```

Key values to change (use `nano` to edit, `Ctrl+O` to save, `Ctrl+X` to exit):

```env
# Set to production
NODE_ENV=production

# Replace with your actual domain once you have one
DW_ADMIN_HOST=https://admin.yourdomain.com/
DW_FRONTEND_HOST=https://yourdomain.com/
DW_AUTH_COOKIE_DOMAIN=yourdomain.com

# Generate a strong random secret (run: openssl rand -hex 32)
DW_COOKIE_SECRET=REPLACE_WITH_RANDOM_STRING
DW_JWT_SECRET=REPLACE_WITH_ANOTHER_RANDOM_STRING

# Your SMTP email provider (e.g., SendGrid, Mailgun, Gmail)
DW_SMTP_HOST=smtp.sendgrid.net
DW_SMTP_PORT=587
DW_SMTP_USER=apikey
DW_SMTP_PASS=YOUR_SMTP_PASSWORD
DW_SMTP_FROM=no-reply@yourdomain.com

# Stripe (get from stripe.com dashboard)
DW_STRIPE_SECRET_KEY=sk_live_...

# PayPal (get from developer.paypal.com)
DW_PAYPAL_SANDBOX=false
DW_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID
DW_PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_CLIENT_SECRET

# Google reCAPTCHA (get from google.com/recaptcha)
DW_RECAPTCHA_SECRET=YOUR_RECAPTCHA_SECRET

# IPInfo (optional, for geo lookup - get from ipinfo.io)
DW_IPINFO_API_KEY=YOUR_IPINFO_KEY

# Admin account email
DW_ADMIN_EMAIL=admin@yourdomain.com

# Your website name
DW_WEBSITE_NAME="Your App Name"
DW_TIMEZONE=UTC
```

To generate strong secrets, run this on the server:
```bash
openssl rand -hex 32
```
Run it twice — once for `DW_COOKIE_SECRET`, once for `DW_JWT_SECRET`.

---

### Frontend

```bash
cp /opt/darywin/frontend/.env.docker.example /opt/darywin/frontend/.env.docker
nano /opt/darywin/frontend/.env.docker
```

Key values to change:

```env
VITE_NODE_ENV=production

# Replace with your actual domain
VITE_DW_API_HOST=https://api.yourdomain.com
VITE_DW_CDN_USERS=https://api.yourdomain.com/cdn/darywin/users
VITE_DW_CDN_PROPERTIES=https://api.yourdomain.com/cdn/darywin/properties
VITE_DW_CDN_LOCATIONS=https://api.yourdomain.com/cdn/darywin/locations

# Stripe publishable key (starts with pk_live_)
VITE_DW_STRIPE_PUBLISHABLE_KEY=pk_live_...

# PayPal client ID
VITE_DW_PAYPAL_CLIENT_ID=YOUR_PAYPAL_CLIENT_ID

# Google reCAPTCHA site key (public, not secret)
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

---

### Admin Panel

```bash
cp /opt/darywin/admin/.env.docker.example /opt/darywin/admin/.env.docker
nano /opt/darywin/admin/.env.docker
```

Key values to change:

```env
VITE_NODE_ENV=production

# Replace with your actual domain
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

## 8. Update docker-compose.yml

Open the production compose file and change the default MongoDB credentials:

```bash
nano /opt/darywin/docker-compose.yml
```

Change these two lines (pick a strong password):
```yaml
MONGO_INITDB_ROOT_USERNAME: admin        # change this
MONGO_INITDB_ROOT_PASSWORD: admin        # CHANGE THIS - use a strong password
```

Also update the connection string in `ME_CONFIG_MONGODB_URL` to match:
```yaml
ME_CONFIG_MONGODB_URL: mongodb://YOUR_NEW_USER:YOUR_NEW_PASS@mongo:27017/
```

And update your backend `.env.docker` to match:
```env
DW_DB_URI="mongodb://YOUR_NEW_USER:YOUR_NEW_PASS@mongo:27017/darywin?authSource=admin&appName=darywin"
```

---

## 9. Start the Application

```bash
cd /opt/darywin

# Build images and start all containers (takes 5–10 minutes first time)
docker compose up -d --build

# Watch the logs to make sure everything started correctly
docker compose logs -f
```

Press `Ctrl+C` to stop watching logs (containers keep running).

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

At this point your app is accessible via your server's IP:
- Frontend: `http://YOUR_SERVER_IP:8081`
- Admin: `http://YOUR_SERVER_IP:3003`
- API: `http://YOUR_SERVER_IP:4004`
- MongoDB UI: `http://YOUR_SERVER_IP:8084`

---

## 10. Point a Domain to Your Server

> Skip this section if you don't have a domain yet. You can use the IP directly for testing.

1. Buy a domain from Namecheap, Cloudflare, or GoDaddy
2. Go to your domain's **DNS settings**
3. Add these **A records** (replace `65.21.100.200` with your server IP):

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `65.21.100.200` | Auto |
| A | `www` | `65.21.100.200` | Auto |
| A | `api` | `65.21.100.200` | Auto |
| A | `admin` | `65.21.100.200` | Auto |

DNS changes can take a few minutes to a few hours to propagate.

---

## 11. Set Up HTTPS with Caddy

Caddy is a web server that automatically obtains and renews SSL certificates. It acts as a reverse proxy sitting in front of your Docker containers.

### Install Caddy

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

Replace the entire contents with (substituting your real domains):

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

Caddy will automatically request free SSL certificates from Let's Encrypt. Your app is now live at:
- `https://yourdomain.com` — Customer frontend
- `https://admin.yourdomain.com` — Admin panel
- `https://api.yourdomain.com` — Backend API

> **Important**: Go back and update all `DW_*_HOST` and `VITE_DW_API_HOST` values in your `.env.docker` files to use the `https://` URLs, then rebuild:
> ```bash
> cd /opt/darywin && docker compose up -d --build
> ```

---

## 12. Future Deployments

After making code changes and pushing to GitHub, deploy to your server with:

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Deploy everything (backend + admin + frontend)
/opt/darywin/__scripts/dw-deploy.sh all

# Or deploy selectively
/opt/darywin/__scripts/dw-deploy.sh backend    # backend only
/opt/darywin/__scripts/dw-deploy.sh ui         # admin + frontend only
/opt/darywin/__scripts/dw-deploy.sh frontend   # frontend only
/opt/darywin/__scripts/dw-deploy.sh admin      # admin only
```

> Note: The deploy scripts use `git pull` + restart. They expect the repo to be at `/opt/darywin`.

---

## 13. Useful Commands

### Container management
```bash
# View running containers
docker compose ps

# View logs (all services)
docker compose logs -f

# View logs for a specific service
docker compose logs -f dw-backend

# Restart a single service
docker compose restart dw-backend

# Stop everything
docker compose down

# Stop and remove all data (careful — deletes database!)
docker compose down -v
```

### Disk & memory
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check Docker disk usage
docker system df
```

### MongoDB access
```bash
# Open MongoDB shell inside the container
docker exec -it darcom-mongo-1 mongosh -u admin -p YOUR_MONGO_PASSWORD
```

### View Caddy logs
```bash
journalctl -u caddy -f
```

---

## Troubleshooting

**Containers won't start**
```bash
docker compose logs dw-backend
```
Most issues are missing or wrong values in `.env.docker` files.

**Frontend shows blank page**
Check that `VITE_DW_API_HOST` in `frontend/.env.docker` points to the correct API URL and that you rebuilt after changing it.

**Cannot connect via SSH**
Make sure your SSH key was added correctly. Some providers also have a web console you can use as a fallback.

**SSL certificate not working**
Ensure your domain's DNS A records are pointing to the correct server IP and have propagated. Check Caddy status with `systemctl status caddy`.

**Out of memory**
Add swap space:
```bash
/opt/darywin/__scripts/swap.sh
```
