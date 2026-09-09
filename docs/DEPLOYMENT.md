# Deployment — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/DEPLOYMENT.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed |

---

## 1. Topology

```
                    Cloudflare DNS
                          │
                    Vercel edge  ── static assets, ISR cache, image optimisation
                          │
                 Next.js (Mumbai, bom1)
                    │           │
                    │           └── Cloudflare R2 ── CDN ── images
                    │
              Neon Postgres (Singapore, nearest region)
                    │
        Resend · Razorpay · Upstash · Sentry · PostHog
```

**Region matters here.** The customers are in India. Serverless functions run in `bom1` (Mumbai); the database is in the nearest Neon region. A US-East default would add roughly 200ms to every query for no reason.

---

## 2. Environments

| | Local | Preview | Production |
|---|---|---|---|
| Trigger | `npm run dev` | Every pull request | Merge to `main` |
| URL | `localhost:3000` | `*.vercel.app` | `www.burla.co.in` |
| Database | Neon dev branch | **Neon branch per PR** | Neon production |
| Data | Demo seed | Demo seed | Real only |
| `robots.txt` | `Disallow: /` | `Disallow: /` | allow |
| Payments | test keys | test keys | live keys |
| Errors shown | full | full | generic + correlation id |

Preview deploys get their **own database branch**, so a migration in a PR is tested against a real copy of the schema and cannot affect anything else. This is the main reason for choosing Neon.

`robots.txt` currently emits `Disallow: /` for every environment. Flipping that for production is a launch-checklist item, and a deliberate one — a half-populated catalogue should not be indexed.

---

## 3. Pipeline

```
push
 ├─ typecheck        tsc --noEmit
 ├─ lint             eslint
 ├─ unit             vitest
 ├─ build            next build
 ├─ integration      vitest, against an ephemeral Neon branch
 └─ e2e              playwright, against the preview URL
        │
     merge to main
        │
 ├─ migrate          expand-only, direct connection, advisory-locked
 ├─ deploy
 ├─ smoke            /api/health, /, one product page
 └─ notify
```

**Nothing merges with a failing check.** Not "usually" — the branch is protected.

Migrations run **before** the deploy and are expand-only (`MIGRATIONS.md` §4), so the currently-running code keeps working during the window in which both versions are live.

---

## 4. Zero-downtime, and what makes it possible

Vercel deploys atomically: the new build serves only once it is ready, and the old one is not torn down first. There is no window where nothing answers.

What can still break a deploy is a schema change the old code cannot tolerate, which is exactly what expand/contract prevents.

Rollback is a promotion of the previous deployment — seconds, in the Vercel dashboard or CLI. **A rollback does not undo a migration**, which is the reason destructive changes never ship with the code that needs them.

---

## 5. Build configuration

| Setting | Value |
|---|---|
| Node | 20.x — matches local 20.15 |
| Package manager | **npm**. The lockfile is npm's, do not switch |
| Install | `npm ci` |
| Build | `npm run build --workspace=apps/web` |
| Output | `.next`, standalone |
| Function region | `bom1` |
| Function memory | 1024MB default, raised only if measured |

`npm ci`, never `npm install`, in CI: it installs exactly the lockfile and fails if `package.json` and the lockfile disagree, which is a real difference and not pedantry.

---

## 6. Secrets

Set in the Vercel dashboard, scoped per environment. Never in the repository, never in a build log, never in a code comment.

| Scope | Contains |
|---|---|
| Production | Live keys, production `DATABASE_URL` |
| Preview | Test keys, branch database URL |
| Development | Not set — local `.env.local` only |

Rotation schedule is in `ENVIRONMENT.md` §6. The production connection string exists in exactly one place: Vercel.

---

## 7. Headers and edge

`next.config.ts` already sets four security headers. Production adds:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `Content-Security-Policy` | Explicit allowlist; `default-src 'self'`; nonce-based scripts |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, microphone, geolocation denied |
| `X-Frame-Options` | `DENY` |

CSP is introduced in report-only mode first. A CSP written blind and enforced immediately breaks analytics, the payment iframe, or fonts — usually all three — and does so in production, where the report would have told us for free.

---

## 8. Domain and DNS

| Record | Purpose |
|---|---|
| `A` / `CNAME` → Vercel | The site |
| `www` → apex, or apex → `www` | One canonical host. Redirect the other |
| `TXT` SPF | Resend |
| `CNAME` DKIM | Resend |
| `TXT` DMARC | Start `p=none`, tighten after observing |
| `CNAME` for the image CDN | R2 public bucket |

Canonical host must match `NEXT_PUBLIC_SITE_URL` exactly, or every canonical tag and sitemap entry points at a redirect.

---

## 9. Launch checklist

**Blocking — cannot go live without:**

- [ ] `OQ-002` Registered firm name
- [ ] `OQ-003` FSSAI licence number — a food site legally must display it
- [ ] `OQ-005` Grievance officer (Consumer Protection E-Commerce Rules 2020)
- [ ] Real product data, or the catalogue restricted to confirmed items (`OQ-016`)
- [ ] Real photography, or honest placeholders (`OQ-017`)
- [ ] Policies reviewed by someone qualified
- [ ] `robots.txt` allows indexing
- [ ] `DemoNotice` component removed
- [ ] Demo seed proven unable to run in production
- [ ] Every environment variable set and validated at boot
- [ ] Enquiry form verified end to end — submits, persists, emails
- [ ] Backups verified by an actual restore (`DATABASE-RECOVERY.md`)
- [ ] Sentry receiving events, PII scrubbing confirmed
- [ ] Uptime monitor on `/api/health`

**If commerce is enabled:**

- [ ] Live Razorpay keys, webhook registered and signature-verified
- [ ] A real payment placed and refunded end to end
- [ ] Refund, shipping and returns policies published

**Should be done, will not block:**

- [ ] Lighthouse ≥ 90 on the four key templates
- [ ] Structured data validated
- [ ] Sitemap submitted to Search Console
- [ ] 404 and 500 pages verified in production

---

## 10. Post-launch

| When | What |
|---|---|
| First hour | Watch Sentry and the health check. Place a test enquiry |
| First day | Check Core Web Vitals, confirm indexing has begun |
| First week | Review search queries for gaps in the catalogue |
| Monthly | Dependency updates, `npm audit`, backup restore drill |
| Quarterly | Access review — who still needs admin |

---

## 11. Open questions

| ID | Question |
|---|---|
| `OQ-068` | Who owns the domain and DNS, and do we have access |
| `OQ-069` | Who owns the Vercel and Neon accounts — the client, not us, ideally from day one |
| `OQ-070` | Launch date, and whether it is tied to anything external |
