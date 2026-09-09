# Environment & Configuration — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/ENVIRONMENT.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed |
| Template | `.env.example` — names only, no values |

---

## 1. Rules

1. **No secret is ever hard-coded.** Not in source, not in a config file, not in a comment, not "temporarily".
2. **No secret is ever committed.** `.gitignore` blocks `.env` and `.env.*`, with `!.env.example` as the single exception.
3. **`.env.example` contains names only.** If a value appears there, it is a leak, whatever the value is.
4. **Everything is validated at boot.** A missing variable fails the process on startup with a clear message, never at 2am inside a request.
5. **`NEXT_PUBLIC_` means public.** Anything with that prefix is compiled into the browser bundle. A secret behind it is published, not configured.
6. **Local development never points at production.** Enforced, see §5.

---

## 2. Validation at boot

One module, `lib/env.ts`, parsed once with Zod. Nothing else in the codebase reads `process.env`.

```ts
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  APP_ENV: z.enum(["development", "preview", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().startsWith("re_"),
  // …
});

export const env = serverSchema.parse(process.env);   // throws at import time
```

Three consequences worth having:

- **A typo is a startup crash, not a runtime surprise.** `RESEND_API_KY` fails the deploy, not the first enquiry.
- **`AUTH_SECRET` shorter than 32 characters cannot be deployed.** The length is a schema rule, not a README note.
- **Types are inferred.** `env.DATABASE_URL` is `string`, not `string | undefined`, so no defensive `??` scattered around.

Client variables are parsed by a separate `clientSchema` that contains only `NEXT_PUBLIC_*` keys. The server module is imported with `import "server-only"`, so a client component that reaches for it fails the build rather than shipping a secret.

---

## 3. The variables

| Variable | Scope | Required | Purpose |
|---|---|:--:|---|
| `NODE_ENV` | server | ✔ | Framework behaviour |
| `APP_ENV` | server | ✔ | Which deployment this is. Guards destructive scripts |
| `NEXT_PUBLIC_SITE_URL` | client | ✔ | Canonicals, sitemap, absolute links |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | client | ✔ | WhatsApp CTA |
| `DATABASE_URL` | server | ✔ | Pooled connection, application |
| `DATABASE_URL_UNPOOLED` | server | ✔ | Direct connection, migrations only |
| `AUTH_SECRET` | server | ✔ | Session signing. 32+ bytes |
| `AUTH_URL` | server | ✔ | Callback base |
| `RESEND_API_KEY` | server | ✔ | Transactional email |
| `EMAIL_FROM` | server | ✔ | Verified sender |
| `ENQUIRY_NOTIFY_TO` | server | ✔ | Where enquiries are delivered |
| `R2_*` (5) | server | ✔ | Object storage |
| `UPSTASH_REDIS_REST_*` (2) | server | ✔ | Rate limiting |
| `TURNSTILE_SECRET_KEY` | server | ✔ | Bot verification |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | client | ✔ | Widget |
| `RAZORPAY_*` (3) | server | `[commerce]` | Payments |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | both | ✔ prod | Error monitoring |
| `SENTRY_AUTH_TOKEN` | build | ✔ prod | Source map upload |
| `NEXT_PUBLIC_POSTHOG_*` (2) | client | optional | Analytics |

**Two of these already exist** — `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_WHATSAPP_NUMBER` are read today with `??` fallbacks. They move into the validated module, and the fallbacks are removed; a production deploy with the wrong site URL emits wrong canonicals silently, which is exactly the class of bug validation is for.

---

## 4. Environments

| | Local | Preview | Production |
|---|---|---|---|
| `APP_ENV` | `development` | `preview` | `production` |
| Database | Neon dev branch | Neon branch per PR | Neon production |
| Demo seed | ✔ | ✔ | **✘ blocked** |
| Payments | test keys | test keys | live keys |
| Email | Resend sandbox | sandbox | live domain |
| `robots.txt` | `Disallow: /` | `Disallow: /` | allow |
| Sentry | off | on | on |
| Debug errors | full | full | generic message only |

Neon branching gives each preview deploy a real, isolated copy of the schema without Docker or a shared staging database that everyone breaks.

---

## 5. Not pointing local development at production

The brief calls this out specifically, because it is the mistake that destroys data rather than merely causing an outage.

Three independent guards, because one is not enough:

**1. Separate credentials.** The production connection string exists only in Vercel. It is never in a local file, never in a shared document, never pasted into a terminal.

**2. A boot assertion.** Any script that writes or resets refuses to run against a production host:

```ts
export function assertNotProduction(op: string) {
  if (env.APP_ENV === "production") {
    throw new Error(`Refusing to ${op} against production.`);
  }
  if (/prod/i.test(env.DATABASE_URL) && env.APP_ENV !== "production") {
    throw new Error("DATABASE_URL looks like production but APP_ENV is not. Refusing.");
  }
}
```

Called by `db:seed`, `db:reset`, `db:push` and every test setup. The second check catches the genuinely dangerous case: the production URL pasted into a local `.env`, where the first check would pass.

**3. Tests use their own database.** `vitest.setup.ts` calls `assertNotProduction("run tests")` before opening a connection, and integration tests run against a dedicated branch that is truncated between suites. Production data never appears in a test run, which also keeps customer PII out of CI logs.

---

## 6. Rotation

| Secret | Rotate | Trigger |
|---|---|---|
| `AUTH_SECRET` | annually | Suspected exposure. Invalidates all sessions — announce it |
| `DATABASE_URL` | annually | Personnel change, exposure |
| `RAZORPAY_KEY_SECRET` | annually | Exposure. Coordinate — in-flight payments |
| `RAZORPAY_WEBHOOK_SECRET` | annually | Exposure. Update Razorpay first |
| `RESEND_API_KEY`, `R2_*`, `UPSTASH_*` | annually | Exposure |

If a secret reaches a commit, rotating it is the fix. Removing the commit is not: it is already in every clone, every fork and the reflog.

---

## 7. What does not belong in the environment

| Not an env var | Where it lives | Why |
|---|---|---|
| Business address, GSTIN, FSSAI | `site_settings` table | The client edits it, not the deploy |
| Product prices | `product_variants` | Data |
| Feature copy | `pages` | Content |
| Design tokens | `globals.css` | Code |
| Feature flags | `site_settings`, or code | A redeploy to flip a flag is a smell |

The dividing line: **if it differs between environments, it is configuration; if it differs between Tuesdays, it is data.**
