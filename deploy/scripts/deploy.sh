#!/usr/bin/env bash
#
# Deploys what is on main to the server. Run as the burla user:
#
#   sudo -u burla /srv/burla/deploy/scripts/deploy.sh
#
# The order is the one that matters: migrate first, then build, then restart.
# Migrations are expand-only (docs/MIGRATIONS.md §4), so the running version
# keeps working during the window where the old code meets the new schema.
set -euo pipefail

APP_DIR=/srv/burla
cd "$APP_DIR"

# The migration and verification steps run as plain Node scripts, outside
# systemd, so they need the environment handed to them. Same file the
# storefront service uses; read it rather than keeping a second copy.
set -a
# shellcheck disable=SC1091
source /etc/burla/web.env
set +a

echo "==> Fetching"
git fetch --quiet origin main
git checkout --quiet main
git reset --hard --quiet origin/main

# Everything, not --omit=dev: the build happens on this machine, and the
# compiler, Tailwind, the migration runner and the tests are all dev
# dependencies. `ci` rather than `install` — it installs the lockfile exactly
# and fails if package.json disagrees with it.
echo "==> Installing exactly what the lockfile says"
npm ci

echo "==> Checks"
npm run typecheck
npm test

echo "==> Migrating"
npm run db:migrate

echo "==> Refusing to continue if production is holding demonstration rows"
npm run db:verify

echo "==> Building"
npm run build
npm run build:admin

echo "==> Restarting"
sudo systemctl restart burla-web burla-admin

# A deploy that leaves a dead service is a failed deploy, not a quiet one.
sleep 3
systemctl is-active --quiet burla-web || { echo "burla-web did not come up"; journalctl -u burla-web -n 40 --no-pager; exit 1; }
systemctl is-active --quiet burla-admin || { echo "burla-admin did not come up"; journalctl -u burla-admin -n 40 --no-pager; exit 1; }

echo "==> Smoke test"
curl -fsS -o /dev/null "http://127.0.0.1:3000/" || { echo "the storefront did not answer"; exit 1; }
curl -fsS -o /dev/null "http://127.0.0.1:3001/login" || { echo "the admin did not answer"; exit 1; }

echo "Deployed $(git rev-parse --short HEAD)."
