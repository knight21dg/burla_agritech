# Observability — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/OBSERVABILITY.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed |

---

## 1. What this is for

A small business site does not need a distributed tracing platform. It needs to answer four questions quickly:

1. **Is the site up?**
2. **Did that customer see an error?**
3. **Are enquiries actually arriving?**
4. **What broke, and what changed just before it broke?**

Everything below exists to answer one of those. Anything that answers none of them is not built.

---

## 2. Logging

Structured JSON to stdout. Vercel collects it; no logging agent, no log shipper.

```ts
log.info("enquiry.created", { enquiryId, category, correlationId });
log.error("email.send_failed", { enquiryId, provider: "resend", correlationId, err });
```

| Level | Used for |
|---|---|
| `error` | Something failed and a human should know |
| `warn` | Degraded but handled — email retry, rate limit tripped |
| `info` | Meaningful business events — enquiry created, order paid, product published |
| `debug` | Local only. Never enabled in production |

### Never logged

Passwords, password hashes, session tokens, reset tokens, API keys, `DATABASE_URL`, Razorpay secrets, full request bodies from auth or checkout, card data of any kind.

This is enforced by a redaction list in the logger, not by remembering. A field named `password`, `token`, `secret`, `key`, `authorization` or `cookie` is replaced with `[redacted]` at serialisation, at any depth.

Customer email addresses and phone numbers are logged only where the log is about that customer and only at `info` — never inside an error payload that may end up in a third-party dashboard.

### Correlation id

One id per request, generated at the edge, attached to every log line, sent to Sentry, and shown to the user on a 500:

> Something went wrong. Reference `a3f9c1`.

That reference makes a support message actionable without a stack trace ever reaching the browser.

---

## 3. Errors — Sentry

| Setting | Value |
|---|---|
| Sample rate | 100% of errors |
| Trace sample | 10% in production |
| Release | Git SHA, so a regression maps to a deploy |
| Source maps | Uploaded at build, not served publicly |
| `beforeSend` | Scrubs the redaction list, drops known browser-extension noise |

**Alert on:**

| Condition | Why |
|---|---|
| Any unhandled server error | Should be zero |
| Enquiry submission failure | Directly loses a lead |
| Email send failure | The lead is saved but nobody was told |
| Payment webhook failure | Money is involved |
| Database connection failure | Everything |
| Error rate above baseline after a deploy | Regression |

Alerts go to email and WhatsApp. An alert nobody sees is a log line with extra steps.

---

## 4. Uptime

An external monitor hits `/api/health` every minute from outside our infrastructure — a monitor running on the same platform cannot tell you the platform is down.

`/api/health` runs one `SELECT 1` and returns 200 or 503. It must stay cheap: a health check that does real work becomes the load it is meant to detect.

It returns no secrets, no environment names and no connection strings.

---

## 5. Metrics worth watching

Deliberately few. Each has an owner and an action.

| Metric | Source | Acted on when |
|---|---|---|
| Uptime | External monitor | Any downtime |
| p95 response time | Vercel | Above 800ms sustained |
| Error rate | Sentry | Any increase after a deploy |
| Core Web Vitals — LCP, INP, CLS | Vercel Analytics | Below "good" on key templates |
| Enquiries per day | Database | A drop to zero means something broke |
| Email delivery rate | Resend | Below 95% |
| Search queries with no results | Database | Weekly, as a catalogue gap signal |
| Database connections | Neon | Approaching the pool ceiling |
| Failed logins | Database | A spike suggests credential stuffing |

**Enquiries per day is the one that matters most.** The current form is a `setTimeout` that always reports success; the failure mode after it becomes real is the same shape — everything looks fine and nothing arrives. A metric that goes to zero is the only thing that catches it.

---

## 6. Business events

Recorded in the database, not only in analytics, because they are business records:

`enquiry.created` · `enquiry.replied` · `product.published` · `stock.adjusted` · `order.paid` · `order.shipped` · `user.registered`

Admin mutations additionally write `audit_log` in the same transaction (`AUTHORIZATION.md` §8).

---

## 7. Analytics — PostHog

Consent first. Under the DPDP Act 2023 consent is opt-in and withdrawal must be as easy as giving it, so the banner is functional, not decorative, and nothing loads before a choice is made.

Events: page view, category view, product view, search, add to bag, enquiry submitted, checkout step, purchase.

**No PII in properties.** A user id, never an email address. Search queries are stored as typed, which is another reason consent is real.

Analytics answers "what are people looking for". It is never the source of truth for a business number — that is Postgres.

---

## 8. Dashboards

Three, no more:

1. **Health** — uptime, error rate, p95, database connections.
2. **Business** — enquiries, top products, search terms with no results, orders.
3. **Performance** — Core Web Vitals by template.

A dashboard nobody opens is worse than none, because it creates the impression of monitoring.

---

## 9. When something breaks

```
1. Health check       is it up at all
2. Sentry             what is the error, when did it start
3. Deployments        did it start with a deploy → roll back first, diagnose after
4. Integrations       status pages: Neon, Vercel, Resend, Razorpay
5. Correlation id     if a customer reported it, go straight to their request
```

**Roll back first, diagnose after.** The site being up is worth more than understanding the bug ten minutes sooner, and the failing build is still there to read.

---

## 10. Open questions

| ID | Question |
|---|---|
| `OQ-071` | Who receives production alerts, and on which number |
| `OQ-072` | Log retention period |
| `OQ-067` | PostHog region — EU or US |
