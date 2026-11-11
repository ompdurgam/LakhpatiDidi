#!/usr/bin/env bash
# =============================================================================
# deploy.sh — Lakhpati Didi production deployment script
#
# Usage:
#   ./deploy.sh           # Deploy latest from current branch
#   ./deploy.sh --migrate # Deploy + run DB migrations (use on schema changes)
#   ./deploy.sh --reset   # Full reset: pull → wipe DB → migrate → restart (⚠️ danger)
#
# Run from the app directory: /home/appuser/app
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="lakhpati-didi"
GIT_BRANCH="${GIT_BRANCH:-main}"
LOG_FILE="/var/log/${APP_NAME}/deploy.log"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()    { echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"; }
warn()    { echo -e "${YELLOW}[!]${NC} $1" | tee -a "$LOG_FILE"; }
error()   { echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"; exit 1; }
section() { echo -e "\n${GREEN}━━━ $1 ━━━${NC}" | tee -a "$LOG_FILE"; }

# ── Flags ─────────────────────────────────────────────────────────────────────
RUN_MIGRATE=false
RUN_RESET=false
for arg in "$@"; do
  case $arg in
    --migrate) RUN_MIGRATE=true ;;
    --reset)   RUN_RESET=true; RUN_MIGRATE=true ;;
  esac
done

# ── Preflight ─────────────────────────────────────────────────────────────────
mkdir -p "$(dirname "$LOG_FILE")"
echo "" >> "$LOG_FILE"
echo "============================================================" >> "$LOG_FILE"
echo "Deploy started at $TIMESTAMP" >> "$LOG_FILE"
echo "============================================================" >> "$LOG_FILE"

section "Pre-flight checks"

cd "$APP_DIR"

command -v node  >/dev/null || error "node not found"
command -v npm   >/dev/null || error "npm not found"
command -v pm2   >/dev/null || error "pm2 not found — run: sudo npm install -g pm2"
command -v git   >/dev/null || error "git not found"

info "Node $(node --version) · npm $(npm --version)"
info "Working directory: $APP_DIR"

# ── Git pull ──────────────────────────────────────────────────────────────────
section "Pulling latest code from $GIT_BRANCH"

PREV_COMMIT="$(git rev-parse --short HEAD)"
git fetch origin "$GIT_BRANCH"
git reset --hard "origin/$GIT_BRANCH"
NEW_COMMIT="$(git rev-parse --short HEAD)"

if [[ "$PREV_COMMIT" == "$NEW_COMMIT" ]]; then
  warn "No new commits (still at $PREV_COMMIT). Continuing anyway."
else
  info "Updated $PREV_COMMIT → $NEW_COMMIT"
fi

# ── Dependencies ──────────────────────────────────────────────────────────────
section "Installing dependencies"

npm install --include=dev 2>&1 | tee -a "$LOG_FILE"
info "Dependencies installed"

# ── Build ─────────────────────────────────────────────────────────────────────
section "Building frontend (React + Vite)"

npm run build 2>&1 | tee -a "$LOG_FILE"
info "Frontend built → dist/"

# ── Database ──────────────────────────────────────────────────────────────────
if [[ "$RUN_RESET" == true ]]; then
  section "Database RESET (destructive!)"
  warn "Resetting database in 5 seconds — press Ctrl+C to abort!"
  sleep 5
  npm run db:reset 2>&1 | tee -a "$LOG_FILE"
  info "Database reset complete"

elif [[ "$RUN_MIGRATE" == true ]]; then
  section "Running database migrations"
  npm run db:migrate 2>&1 | tee -a "$LOG_FILE"
  npm run db:status  2>&1 | tee -a "$LOG_FILE"
  info "Migrations complete"

else
  warn "Skipping migrations. Use --migrate flag to run them."
fi

# ── Restart API server ────────────────────────────────────────────────────────
section "Restarting API server (PM2)"

if pm2 show "$APP_NAME" > /dev/null 2>&1; then
  pm2 restart "$APP_NAME" 2>&1 | tee -a "$LOG_FILE"
  info "PM2 process '$APP_NAME' restarted"
else
  warn "PM2 process '$APP_NAME' not found — starting fresh"
  pm2 start "node --env-file-if-exists=.env server/index.ts" \
    --name "$APP_NAME" \
    --cwd "$APP_DIR" 2>&1 | tee -a "$LOG_FILE"
  pm2 save
fi

# ── Health check ──────────────────────────────────────────────────────────────
section "Health check"

sleep 3   # Give the server a moment to come up
API_PORT="${API_PORT:-4000}"

if curl -sf "http://localhost:${API_PORT}/api/meta" > /dev/null; then
  info "API health check passed ✓  http://localhost:${API_PORT}/api/meta"
else
  error "API health check FAILED — check: pm2 logs $APP_NAME"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
section "Deployment complete"
info "Commit : $NEW_COMMIT"
info "Time   : $(date '+%Y-%m-%d %H:%M:%S')"
info "Logs   : $LOG_FILE"
echo ""
info "Run 'pm2 logs $APP_NAME' to watch live logs."

