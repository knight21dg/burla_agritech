# Deploying to a Hostinger VPS — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/DEPLOY-HOSTINGER.md` |
| Version | 1.0 |
| Date | 2026-09-18 |
| Status | Written to be followed |
| Supersedes for this project | The Vercel + Neon + R2 topology in `DEPLOYMENT.md` §1 |

---

## 0. Why this, and not the topology in DEPLOYMENT.md

`DEPLOYMENT.md` describes Vercel, Neon and Cloudflare R2. That is a good shape
and it remains the right answer if the site ever needs to scale beyond one
machine. It is not the shape being deployed, for one concrete reason:

**Uploaded photographs are written to a folder on disk** (`packages/core/src/media/store.ts`,
`MEDIA_DIR`) and served back from it. The R2 code the older document assumes
was never written. On a serverless host the filesystem is wiped between
invocations and the two applications cannot share a folder, so every photo the
client uploads would disappear. On one server with one disk, it simply works.

A VPS also puts the database on the same machine as the applications, which
removes network latency from every query and removes a monthly bill.

**This will not run on Hostinger's shared web hosting.** Those plans serve PHP;
this is a Node process that must stay alive. It needs a VPS (or cloud VPS)
with root access.

---

## 1. What you are building

```
            Hostinger VPS (Ubuntu, root)
    ┌──────────────────────────────────────────┐
    │  nginx :80/:443                          │
    │    www.burla.co.in    → 127.0.0.1:3000   │  the shop
    │    admin.burla.co.in  → 127.0.0.1:3001   │  the admin
    │                                          │
    │  PostgreSQL :5432 (localhost only)       │  one database, both apps
    │  /var/lib/burla/media                    │  uploaded photographs
    │  /srv/burla                              │  the checkout, built here
    └──────────────────────────────────────────┘
```

Sizing: 2 vCPU and 4GB of memory is comfortable, and the memory matters more
than the cores — `next build` is the hungriest thing that runs. 2GB will build
if nothing else is running, but will make you watch it.

---

## 2. Prepare the server

As root, once.

```bash
adduser --system --group --home /srv/burla burla
apt update && apt install -y curl git nginx postgresql ufw

# Node 20+ (the repo requires >=20.9). NodeSource, not the distro package,
# which is usually years behind.
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw enable
```

Postgres listens on localhost only out of the box on Ubuntu. Leave it that
way — nothing outside this machine has any business connecting to it.

```bash
sudo -u postgres createuser burla --pwprompt      # keep the password
sudo -u postgres createdb burla --owner=burla
```

The photo folder, and the folder the secrets live in:

```bash
mkdir -p /var/lib/burla/media && chown burla:burla /var/lib/burla/media
mkdir -p /etc/burla && chmod 750 /etc/burla
```

---

## 3. The checkout

```bash
git clone https://github.com/knight21dg/burla_agritech.git /srv/burla
chown -R burla:burla /srv/burla
chmod +x /srv/burla/deploy/scripts/*.sh
```

The deploy script restarts the two services, so the app user is allowed to do
exactly that and nothing else. `visudo -f /etc/sudoers.d/burla`:

```
burla ALL=(root) NOPASSWD: /usr/bin/systemctl restart burla-web burla-admin
```

---

## 4. Secrets

Two files, `/etc/burla/web.env` and `/etc/burla/admin.env`, both
`chown root:root` and `chmod 600`. **Neither ever goes in git.** Copy the
names from `.env.example` and `apps/admin/.env.example`; what follows is only
what is specific to this server.

Generate the three secrets first, and keep a copy somewhere the client can
reach if you are ever unavailable:

```bash
openssl rand -base64 32   # AUTH_SECRET        — different in each file
openssl rand -base64 24   # IP_HASH_SALT       — the same in both
openssl rand -base64 32   # REVALIDATE_SECRET  — the same in both, this matters
```

`REVALIDATE_SECRET` is how the admin tells the shop that a product changed.
If the two files disagree, every admin edit will appear to save and the
website will keep showing the old version for five minutes. It is the single
easiest thing to get wrong here.

`/etc/burla/web.env`:

```
NODE_ENV=production
APP_ENV=production

DATABASE_URL=postgres://burla:PASSWORD@127.0.0.1:5432/burla
DATABASE_URL_UNPOOLED=postgres://burla:PASSWORD@127.0.0.1:5432/burla

NEXT_PUBLIC_SITE_URL=https://www.burla.co.in
NEXT_PUBLIC_WHATSAPP_NUMBER=919032887292

AUTH_SECRET=…
AUTH_URL=https://www.burla.co.in
IP_HASH_SALT=…
REVALIDATE_SECRET=…
MEDIA_DIR=/var/lib/burla/media
```

There is no connection pooler here, so `DATABASE_URL_UNPOOLED` is the same
string. It is set anyway because the migration runner warns when it is
missing, and a warning you have learned to ignore is worse than no warning.

`/etc/burla/admin.env` is the same database, its own
`AUTH_SECRET`, `AUTH_URL=https://admin.burla.co.in`, the **same**
`IP_HASH_SALT`, `REVALIDATE_SECRET` and `MEDIA_DIR`, plus:

```
STOREFRONT_URL=https://www.burla.co.in
```

The environment module refuses to start with `APP_ENV=production` if
`AUTH_SECRET`, `AUTH_URL`, `IP_HASH_SALT`, `NEXT_PUBLIC_SITE_URL` or
`NEXT_PUBLIC_WHATSAPP_NUMBER` is missing. A bad deploy that never starts is
the point of that.

---

## 5. First run

```bash
cd /srv/burla
sudo -u burla npm ci

set -a; source /etc/burla/web.env; set +a
sudo -u burla --preserve-env npm run db:migrate    # the 10 migration files
sudo -u burla --preserve-env npm run db:seed       # real data only, never --demo
sudo -u burla --preserve-env npm run db:verify     # refuses if sample rows exist

sudo -u burla npm run build
sudo -u burla npm run build:admin
```

Create the owner's admin account — it will ask for a password, which is
hashed, never stored or logged in plain text:

```bash
sudo -u burla --preserve-env npm run admin:create
```

Services and nginx:

```bash
cp deploy/systemd/*.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now burla-web burla-admin

cp deploy/nginx/burla.conf /etc/nginx/sites-available/burla.conf
ln -s /etc/nginx/sites-available/burla.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

DNS: point `burla.co.in`, `www` and `admin` at the VPS address, wait for it to
resolve, then certificates:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d burla.co.in -d www.burla.co.in -d admin.burla.co.in
```

Certbot rewrites the two server blocks to serve TLS and redirect port 80. Its
renewal timer is installed with it; `certbot renew --dry-run` once, so you
find out now rather than in ninety days.

---

## 6. Every deploy after the first

```bash
sudo -u burla /srv/burla/deploy/scripts/deploy.sh
```

Fetch, install, typecheck, test, migrate, verify, build, restart, and a smoke
test on both applications. It stops at the first failure, and it prints the
last forty log lines of a service that fails to come up.

Migrating before building is deliberate: migrations are expand-only, so the
version currently serving customers keeps working through the window in which
the old code is talking to the new schema.

Watching one: `journalctl -u burla-web -f`.

---

## 7. Backups

```bash
crontab -e
0 2 * * *  /srv/burla/deploy/scripts/backup.sh >> /var/log/burla-backup.log 2>&1
```

It dumps the database and archives the photo folder. **Set `BACKUP_REMOTE` in
`/etc/burla/web.env`** to somewhere off this machine; a backup on the same
disk as the thing it protects survives a mistake but not a dead server.

Then do the part everyone skips, once, before launch: restore last night's
dump into a scratch database and open it. `DATABASE-RECOVERY.md` §6.

---

## 8. Before the site is public

These are deliberate switches, not oversights. Each is a small change, and
none should be flipped before the thing behind it is true.

| | What | Blocked on |
|---|---|---|
| 🔴 | FSSAI licence number — printed on every page, legally required for a food business | The client. Never invented |
| 🔴 | The real catalogue. The database holds 62 sample products and 1 real one | The client's product spreadsheet |
| 🟠 | Grievance officer name and contact | Required by the E-Commerce Rules |
| 🟠 | `robots.ts` returns `Disallow: /` for everything | The two rows above |
| 🟠 | The `DemoNotice` bar at the top of every page | Real content and photography |
| 🟠 | UPI and card are offered but the server accepts cash on delivery only | A decision, then a payment gateway |
| 🟡 | Social media links in the footer are `#` | The client's page URLs |

Until those are settled, deploying is still worth doing: the client gets a
real admin at a real address to load their products and photographs into,
which is what unblocks most of the list. The site simply is not indexed while
it happens.

---

## 9. If the machine is lost

1. New VPS, sections 2 and 3.
2. Restore the newest `burla_*.dump` with `pg_restore`.
3. Unpack the newest `media_*.tar.gz` into `/var/lib/burla/media`.
4. Rewrite `/etc/burla/*.env` from the secrets record, section 4.
5. Section 5 from `npm ci`, skipping the seed — the dump is the data.

Two of those five depend on something being held off the machine: the backups
and the secrets. Both are the reason to check, today, that they are.
