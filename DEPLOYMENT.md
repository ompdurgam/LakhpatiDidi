# Deploying on an Ubuntu VM

This guide sets up the Lakhpati Didi portal on one Ubuntu server:

```
Browser / phone ──HTTPS──▶ Nginx :443 ──▶ Node API :4000 ──▶ MySQL :3306
                                             │
                                             └─ also serves the built PWA (dist/)
```

The Node process serves both the API (`/api/*`) and the built frontend from one origin, so there is only one app process to run. Nginx handles HTTPS in front of it.

Tested target: **Ubuntu 24.04 LTS**. Ubuntu 22.04 works with the same steps.

## 1. What you need

| Item | Minimum |
|---|---|
| VM | 2 vCPU, 4 GB RAM, 30 GB disk (2 GB RAM works if you add swap, see step 2) |
| Domain | A DNS `A` record pointing at the VM's public IP, e.g. `didi.example.gov.in` |
| Open ports | 22 (SSH), 80 and 443 (web). Do **not** open 3306 or 4000. |
| Access | A user with `sudo` |

HTTPS is required, not optional. The app is a PWA: install, offline mode and push notifications only work over HTTPS.

## 2. Prepare the server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx ufw
sudo timedatectl set-timezone Asia/Kolkata
```

Firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

On a 2 GB VM, add swap so the build does not run out of memory:

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 3. Install Node.js 24

The server runs its `.ts` files directly, so it needs **Node 22.18 or newer**. Use Node 24 LTS:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v24.x
```

## 4. Install MySQL 8

```bash
sudo apt install -y mysql-server
sudo systemctl enable --now mysql
sudo mysql_secure_installation
```

Create the database and a dedicated user (do not use `root`). Replace the password:

```bash
sudo mysql <<'SQL'
CREATE DATABASE lakhpati_didi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'didi_app'@'localhost' IDENTIFIED BY 'CHANGE_ME_strong_password';
GRANT ALL PRIVILEGES ON lakhpati_didi.* TO 'didi_app'@'localhost';
FLUSH PRIVILEGES;
SQL
```

The migration runner creates tables and views, so the app user needs full rights on its own database only.

## 5. Get the code

Run the app as its own system user:

```bash
sudo adduser --system --group --home /opt/lakhpati-didi didi
sudo git clone https://github.com/ompdurgam/LakhpatiDidi.git /opt/lakhpati-didi/app
sudo chown -R didi:didi /opt/lakhpati-didi
```

All later commands run as that user, from the app folder:

```bash
sudo -u didi -H bash
cd /opt/lakhpati-didi/app
```

## 6. Configure `.env`

Generate push-notification keys once:

```bash
npx --yes web-push generate-vapid-keys
```

Create `/opt/lakhpati-didi/app/.env`:

```ini
NODE_ENV=production

# MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=didi_app
DB_PASSWORD=CHANGE_ME_strong_password
DB_NAME=lakhpati_didi

# API (Nginx forwards to this; keep it private)
API_PORT=4000

# OTP login. true = the OTP is shown on the login screen (no SMS gateway).
# Set to false only once an SMS provider is connected (see "Before going live").
OTP_DEV_MODE=true

# Web Push. Required when NODE_ENV=production; the API will not start without them.
# Changing these later breaks every phone's existing push subscription.
VAPID_PUBLIC_KEY=paste_public_key
VAPID_PRIVATE_KEY=paste_private_key
VAPID_SUBJECT=mailto:admin@example.gov.in
```

Lock it down:

```bash
chmod 600 .env
```

Optional map basemap: `VITE_MAP_TILE_URL` and `VITE_MAP_ATTRIBUTION` are read **at build time**, so set them in `.env` (or the shell) before `npm run build`. Without them the map shows boundaries only.

## 7. Install, build and set up the database

```bash
npm ci                 # includes dev tools; the build needs TypeScript and Vite
npm run build          # type-check, then build the PWA into dist/
npm run db:migrate     # create all tables + reference data (state, departments, schemes, survey sections)
npm run geo:lgd        # all Chhattisgarh districts, blocks, GPs and villages
```

**Demo or real?** For a demo / UAT server, also run `npm run db:seed` (Bastar demo households, applications and demo logins; it only loads into a database with no users). For production, skip it and create the first admin by hand. They then add everyone else from the Admin screen:

```bash
sudo mysql lakhpati_didi -e "INSERT INTO master_users (name, mobile, role, designation) VALUES ('State Admin', '9XXXXXXXXX', 'admin', 'State MIS');"
```

Map boundaries (district and block files are in git):

```bash
SRC="LGD via indian_admin_boundaries (CC0)"
npm run geo:boundaries -- --level district --file database/data/boundaries/chhattisgarh-districts.geojson --code-field DIST_LGD  --source "$SRC"
npm run geo:boundaries -- --level block    --file database/data/boundaries/chhattisgarh-blocks.geojson    --code-field BLOCK_LGD --source "$SRC"
```

The gram panchayat and village boundary files (about 18 MB each) are not in git. Copy them to `database/data/boundaries/` with `scp`, or rebuild them as described in [database/data/lgd/README.md](database/data/lgd/README.md), then import them the same way with `--level gram_panchayat --code-field GP_LGD` and `--level village --code-field VILLAGE_LGD`.

Check it starts, then stop it with Ctrl+C:

```bash
npm start
# in another shell: curl http://127.0.0.1:4000/api/health
exit   # leave the didi user's shell
```

## 8. Run it as a service (systemd)

Create `/etc/systemd/system/lakhpati-didi.service`:

```ini
[Unit]
Description=Lakhpati Didi portal (API + PWA)
After=network.target mysql.service
Requires=mysql.service

[Service]
Type=simple
User=didi
Group=didi
WorkingDirectory=/opt/lakhpati-didi/app
ExecStart=/usr/bin/node --env-file=.env server/index.ts
Restart=on-failure
RestartSec=5
# The API shuts down cleanly on SIGTERM (closes the DB pool, stops the notification worker).
KillSignal=SIGTERM
TimeoutStopSec=20

NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lakhpati-didi
sudo systemctl status lakhpati-didi
journalctl -u lakhpati-didi -f      # live logs
```

Run **one** instance only. The notification worker runs inside the API process, so a second copy (PM2 cluster mode, two services) would send every notification twice.

## 9. Nginx and HTTPS

Create `/etc/nginx/sites-available/lakhpati-didi` (replace the domain):

```nginx
server {
    listen 80;
    server_name didi.example.gov.in;

    client_max_body_size 2m;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/lakhpati-didi /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Get a free certificate (Certbot edits the Nginx file and sets up auto-renewal):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d didi.example.gov.in
```

Open `https://didi.example.gov.in` and log in with the admin mobile from step 7 (or **9826143412** if you loaded the demo seed). While `OTP_DEV_MODE=true` the OTP appears on screen.

The API trusts `X-Forwarded-For` only from localhost, so keep Nginx on the same VM. If you move Nginx or a load balancer to another machine, change `trust proxy` in [server/app.ts](server/app.ts).

## 10. Updating to a new version

```bash
sudo -u didi -H bash -c '
  cd /opt/lakhpati-didi/app &&
  git pull &&
  npm ci &&
  npm run build &&
  npm run db:migrate
'
sudo systemctl restart lakhpati-didi
```

Take a database backup (step 11) before `db:migrate`. If a migration has to be undone, `npm run db:rollback` reverts the most recent one.

The PWA updates itself on phones the next time they open the app. Never run `npm run db:reset` on the server: it drops the whole database.

## 11. Backups

Nightly dump, 14 days kept. Create `/etc/cron.d/lakhpati-didi-backup`:

```cron
30 1 * * * root mkdir -p /var/backups/lakhpati-didi && mysqldump --single-transaction --routines lakhpati_didi | gzip > /var/backups/lakhpati-didi/db-$(date +\%F).sql.gz && find /var/backups/lakhpati-didi -name 'db-*.sql.gz' -mtime +14 -delete
```

Copy the backups off the VM as well (object storage or another server). Also keep a copy of `.env`: without the same VAPID keys, phones have to re-subscribe to push.

Restore:

```bash
gunzip -c /var/backups/lakhpati-didi/db-2026-11-10.sql.gz | sudo mysql lakhpati_didi
```

## 12. Before going live

These are known gaps in the current code, not deployment steps:

- **SMS for OTP.** With `OTP_DEV_MODE=true`, anyone can see the login OTP on screen. Connect an SMS provider in the auth module (`server/modules/auth/auth.service.ts`), then set `OTP_DEV_MODE=false`.
- **Demo users and data.** If `db:seed` was run, it created demo accounts (`9826143412`, `9752314412`, `9425118881`, `9301245176`, `9993000001`, …) and sample households. Lock or delete those accounts before real use, or rebuild production without the seed.
- **Role checks.** Any logged-in user can switch roles from the header, and the API records who did what but does not yet restrict actions by role. Add per-role checks before giving access to real users.

## Troubleshooting

| Symptom | Check |
|---|---|
| `502 Bad Gateway` | `systemctl status lakhpati-didi` and `journalctl -u lakhpati-didi -n 50` |
| API exits with `VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set in production` | Add both keys to `.env` (step 6) |
| `ERR_INVALID_TYPESCRIPT_SYNTAX` or `Unknown file extension ".ts"` | Node is older than 22.18. Run `node -v` and reinstall Node 24 (step 3) |
| `ER_ACCESS_DENIED_ERROR` | `DB_USER` / `DB_PASSWORD` in `.env` match the MySQL user from step 4 |
| `npm run build` killed with no message | Out of memory. Add swap (step 2) |
| App won't install, or push doesn't work, on phones | The site must be opened over `https://` with a valid certificate |
| Hindi text shows as `???` | The database was not created with `utf8mb4` (step 4) |
