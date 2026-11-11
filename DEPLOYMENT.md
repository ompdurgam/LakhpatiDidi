# 🚀 Lakhpati Didi — Ubuntu Server Deployment Guide

> **Stack**: React 19 + Vite (PWA) · Node.js + Express 5 (TypeScript) · MySQL  
> **Server**: Ubuntu · IP `172.30.60.13` · User `didi` (sudo)  
> **App path**: `/home/didi/app`  
> **Architecture**: PM2 runs the Express API on port 4000; Nginx proxies `/api/*` and serves the React `dist/` on port 80.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Server Initial Setup](#2-server-initial-setup)
3. [Install Node.js](#3-install-nodejs)
4. [Install & Configure MySQL](#4-install--configure-mysql)
5. [Install Nginx](#5-install-nginx)
6. [Clone the Repository](#6-clone-the-repository)
7. [Configure Environment](#7-configure-environment)
8. [Install Dependencies & Build](#8-install-dependencies--build)
9. [Run Database Migrations](#9-run-database-migrations)
10. [Install & Configure PM2](#10-install--configure-pm2)
11. [Configure Nginx Reverse Proxy](#11-configure-nginx-reverse-proxy)
12. [Fix File Permissions for Nginx](#12-fix-file-permissions-for-nginx)
13. [SSL Certificate with Let's Encrypt](#13-ssl-certificate-with-lets-encrypt)
14. [Firewall Setup](#14-firewall-setup)
15. [Seed Data (Optional)](#15-seed-data-optional)
16. [Verify Deployment](#16-verify-deployment)
17. [PM2 Auto-start on Reboot](#17-pm2-auto-start-on-reboot)
18. [Updating the App](#18-updating-the-app)
19. [Monitoring & Logs](#19-monitoring--logs)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Prerequisites

| Requirement | Version / Notes |
|-------------|----------------|
| Ubuntu | 22.04 LTS or 24.04 LTS |
| RAM | 2 GB minimum |
| Disk | 20 GB minimum |
| Node.js | 22.x (LTS) |
| MySQL | 8.0+ |
| Nginx | Latest stable |
| User account | Must be in the `sudo` group |

> [!NOTE]
> On this server, Node.js v22.23.4, MySQL 8.0, and Nginx were already installed.
> Skip steps 3–5 if they are already present — verify with `node --version`, `systemctl is-active mysql`, and `systemctl is-active nginx`.

---

## 2. Server Initial Setup

SSH into the server as your sudo-capable user:

```bash
ssh didi@172.30.60.13
```

Update the system:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget unzip build-essential ca-certificates gnupg
```

> [!NOTE]
> The app runs under the `didi` user (which is in the `sudo` group). There is no need to create a separate service account.

---

## 3. Install Node.js

> Skip this step if `node --version` already shows v22.x.

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install
sudo apt install -y nodejs

# Verify
node --version    # v22.x.x
npm --version     # 10.x.x
```

---

## 4. Install & Configure MySQL

> Skip installation if `systemctl is-active mysql` returns `active`.

```bash
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```

### Create the database and app user

```bash
sudo mysql -u root
```

```sql
CREATE DATABASE lakhpati_didi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'lakhpati_app'@'localhost' IDENTIFIED BY 'YourStrongPassword';
GRANT ALL PRIVILEGES ON lakhpati_didi.* TO 'lakhpati_app'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

> [!NOTE]
> On this server, the `lakhpati_didi` database and `lakhpati_app` MySQL user were already present with all 30+ tables migrated.

---

## 5. Install Nginx

> Skip if `systemctl is-active nginx` returns `active`.

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 6. Clone the Repository

```bash
cd /home/didi

# Clone into the 'app' directory
git clone https://github.com/ompdurgam/LakhpatiDidi.git app

cd app
```

> [!NOTE]
> If the repo is private, set up an SSH deploy key or personal access token first.

---

## 7. Configure Environment

```bash
cp .env.example .env
nano .env
```

Fill in production values:

```dotenv
# ─── Database ───────────────────────────────────────────────
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=lakhpati_app
DB_PASSWORD=YourStrongPassword
DB_NAME=lakhpati_didi

# ─── API Server ─────────────────────────────────────────────
API_PORT=4000

# ─── IMPORTANT: Disable dev OTP mode in production ──────────
OTP_DEV_MODE=false

# ─── Web Push VAPID Keys ─────────────────────────────────────
VAPID_PUBLIC_KEY=BFt5cEaGWYozyc-kpY50gXt7thb1VimEfgp0NHaXu-EKXdAdDCcP0pSK9H8zULIgSeMjDgQztjyrDzISWs94le0
VAPID_PRIVATE_KEY=KD2g_BKUtyNOLTMGPFEduKxhEYYyuKcChDNojGfnuKY

# ─── SMS Provider (required when OTP_DEV_MODE=false) ─────────
# SMS_API_KEY=your_sms_api_key
# SMS_SENDER_ID=LKHDID
```

> [!CAUTION]
> Never commit `.env` to git. It is listed in `.gitignore`.

> [!IMPORTANT]
> Set `OTP_DEV_MODE=false` in production — in dev mode the OTP is exposed in the API response.

---

## 8. Install Dependencies & Build

```bash
cd /home/didi/app

# Install all dependencies (including devDependencies needed for the build)
npm install

# Type-check and build the React frontend → dist/
npm run build
```

---

## 9. Run Database Migrations

```bash
npm run db:migrate

# Verify
npm run db:status
```

> [!NOTE]
> Always run migrations **before** starting or restarting the app server.

### (Optional) Import geographic LGD data

```bash
# Import LGD geography data (panchayats, blocks, districts)
npm run geo:lgd

# Seed district login accounts
npm run seed:district-logins

# Import geographic boundaries (GeoJSON)
npm run geo:boundaries
```

---

## 10. Install & Configure PM2

PM2 keeps the Node.js server running and auto-restarts it on crashes.

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application
cd /home/didi/app
pm2 start "node --env-file-if-exists=.env server/index.ts" \
  --name lakhpati-didi \
  --cwd /home/didi/app

# Save the process list
pm2 save
```

### Verify it started

```bash
pm2 list
# Should show lakhpati-didi as 'online'

pm2 logs lakhpati-didi --lines 20
# Should show: API ready on http://localhost:4000
```

---

## 11. Configure Nginx Reverse Proxy

```bash
# Remove the default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Create the site config
sudo nano /etc/nginx/sites-available/lakhpati-didi
```

Paste this config:

```nginx
server {
    listen 80 default_server;
    server_name _;            # Matches any hostname / bare IP

    client_max_body_size 10M;

    # Proxy /api/* → Express API on port 4000
    location /api/ {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # Serve React SPA from dist/
    location / {
        root   /home/didi/app/dist;
        index  index.html;
        # Required for React Router client-side navigation
        try_files $uri $uri/ /index.html;
    }

    # Aggressively cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root    /home/didi/app/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable the site
sudo ln -sf /etc/nginx/sites-available/lakhpati-didi /etc/nginx/sites-enabled/lakhpati-didi

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## 12. Fix File Permissions for Nginx

> [!IMPORTANT]
> This step is **required**. Nginx runs as `www-data` and cannot read files inside `/home/didi` by default.
> Without this, the frontend returns **HTTP 500** with `Permission denied` in `/var/log/nginx/error.log`.

```bash
# Allow www-data to traverse the home directory
sudo chmod o+x /home/didi

# Allow www-data to read all files inside dist/
sudo chmod -R o+rX /home/didi/app/dist
```

Verify the fix:

```bash
curl -o /dev/null -w "%{http_code}" http://localhost/
# Should return: 200
```

> [!TIP]
> Re-run `sudo chmod -R o+rX /home/didi/app/dist` after every `npm run build` since it replaces the `dist/` folder.

---

## 13. SSL Certificate with Let's Encrypt

> Requires a domain name pointed at the server. Skip if using the bare IP only.

```bash
sudo apt install -y certbot python3-certbot-nginx

# Replace with your actual domain
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

After this, Nginx will serve the app over HTTPS at `https://your-domain.com`.

---

## 14. Firewall Setup

```bash
# Allow SSH first — do this before enabling the firewall!
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS through Nginx
sudo ufw allow 'Nginx Full'

# Enable
sudo ufw enable

# Check
sudo ufw status verbose
```

> [!CAUTION]
> Always allow `OpenSSH` **before** running `ufw enable` — otherwise you will be locked out.

---

## 15. Seed Data (Optional)

```bash
cd /home/didi/app

npm run geo:lgd                # LGD panchayat / block / district data
npm run seed:district-logins   # District-level login accounts
npm run geo:boundaries         # GeoJSON boundary files
```

---

## 16. Verify Deployment

```bash
# PM2 process running
pm2 list

# API responds (401 = auth guard working — expected)
curl http://localhost:4000/api/meta
# → {"error":"लॉगिन आवश्यक है"}

# Frontend served by Nginx
curl -o /dev/null -w "%{http_code}" http://localhost/
# → 200

# API proxied through Nginx
curl http://localhost/api/meta
# → {"error":"लॉगिन आवश्यक है"}

# From another machine / browser
curl http://172.30.60.13/
```

---

## 17. PM2 Auto-start on Reboot

```bash
pm2 startup systemd
```

PM2 prints a `sudo env PATH=...` command. **Copy and run it exactly as printed.** Then save:

```bash
pm2 save
```

This ensures `lakhpati-didi` restarts automatically if the server reboots.

---

## 18. Updating the App

```bash
cd /home/didi/app

# Pull latest code
git pull origin main

# Install any new dependencies
npm install

# Rebuild the frontend
npm run build

# Re-apply permissions after rebuild (dist/ is replaced)
sudo chmod -R o+rX /home/didi/app/dist

# Run any new migrations
npm run db:migrate

# Restart the API
pm2 restart lakhpati-didi
```

> [!TIP]
> Use `deploy.sh` (included in the repo) to run all update steps in one command:
> ```bash
> chmod +x deploy.sh   # once
> ./deploy.sh --migrate
> ```

---

## 19. Monitoring & Logs

```bash
# Live PM2 logs
pm2 logs lakhpati-didi --lines 100

# PM2 metrics dashboard
pm2 monit

# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log (check here first if frontend returns 500)
sudo tail -f /var/log/nginx/error.log

# MySQL service logs
sudo journalctl -u mysql -f
```

---

## 20. Troubleshooting

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| `502 Bad Gateway` | PM2 / Node not running | `pm2 restart lakhpati-didi` |
| Frontend **HTTP 500** | Nginx `Permission denied` on `dist/` | `sudo chmod o+x /home/didi && sudo chmod -R o+rX /home/didi/app/dist` |
| Blank page on route refresh | React Router fallback missing | Confirm `try_files $uri $uri/ /index.html` in Nginx config |
| `Cannot connect to DB` | Wrong credentials in `.env` | Check `DB_*` values; test: `mysql -u lakhpati_app -p lakhpati_didi` |
| OTP shown on login screen | `OTP_DEV_MODE=true` in production | Set `OTP_DEV_MODE=false` in `.env` → `pm2 restart lakhpati-didi` |
| Push notifications broken | VAPID keys missing from `.env` | Add `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to `.env` |
| Port 4000 already in use | Stale process | `sudo lsof -i :4000` → `kill <PID>` |
| SSL cert expired | Certbot renewal failed | `sudo certbot renew` |
| App not running after reboot | PM2 startup not configured | `pm2 startup systemd` → run printed command → `pm2 save` |
| Frontend 500 after deploy | New `dist/` missing permissions | `sudo chmod -R o+rX /home/didi/app/dist` |

---

## Architecture Overview

```
Browser / Mobile
      │
      ▼  port 80 / 443
  Nginx  (www-data)
      ├── /api/*  ──────► PM2 → Node.js / Express  (port 4000)
      │                            └── MySQL  (port 3306)
      └── /*      ──────► /home/didi/app/dist/  (React SPA)
```

---

> [!NOTE]
> This app is a **PWA** (Progressive Web App). Users can install it on their phones/desktops.
> PWA service workers **require HTTPS** — configure Let's Encrypt (Step 13) before going live.
