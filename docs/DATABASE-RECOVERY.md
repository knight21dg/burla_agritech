# Backup & Recovery — Burla Global Agri Products

| Field | Value |
|---|---|
| Document | `docs/DATABASE-RECOVERY.md` |
| Version | 1.0 |
| Date | 2026-09-09 |
| Status | Proposed |

---

## 1. The only rule that matters

> **A backup that has never been restored is not a backup. It is a hope.**

Everything in this document is ordinary except §6, which is the part that is usually skipped and the only part that proves the rest works.

---

## 2. Objectives

| | Target | Meaning |
|---|---|---|
| **RPO** — how much data we can lose | **5 minutes** | Point-in-time recovery to any moment in the retention window |
| **RTO** — how long recovery takes | **1 hour** | From the decision to restore, to serving customers again |

These are proportionate. A catalogue site taking enquiries is not a payment processor; an hour of downtime is survivable, losing a day of enquiries is not. If online selling is enabled (`OQ-001`), RPO stays at 5 minutes and RTO tightens to 30 minutes, because an unrecoverable paid order is a different class of problem.

---

## 3. What is backed up

| Data | Mechanism | Retention |
|---|---|---|
| Postgres — all tables | Neon continuous WAL + point-in-time restore | 30 days |
| Postgres — weekly logical dump | `pg_dump` to R2, encrypted | 90 days |
| Images and media | R2 versioning + lifecycle | 30 days of versions |
| Schema | Git — migration files are the source of truth | forever |
| Application code | Git | forever |
| Secrets | Vercel, plus an offline record held by the client | — |

**Two independent copies of the database.** Neon PITR handles the common cases — a bad migration, a mistaken delete. The weekly logical dump to R2 handles the uncommon one: losing access to the Neon account itself. A backup that lives only inside the system it is protecting protects against operator error, not vendor loss.

Dumps are encrypted before upload and never contain plaintext secrets. They do contain customer PII, so the bucket is private, access-logged, and lifecycle-expired at 90 days — indefinite retention of personal data is itself a DPDP problem.

---

## 4. Recovery scenarios

### 4.1 Accidental delete or bad UPDATE — the common one

Most likely cause: an admin action, or a migration that did more than intended.

```
1. Stop further writes if the damage is ongoing (maintenance mode).
2. Create a Neon branch from a timestamp just before the incident.
3. Verify the data on that branch. Do not restore blind.
4. Copy back only the affected rows, or promote the branch if the damage is wide.
5. Record what happened.
```

Branching means the damaged database stays untouched while the good copy is inspected. Restoring over the top of the only copy you have, before checking that the restore is correct, is how a recoverable incident becomes a permanent one.

**Estimated: 15–30 minutes.**

### 4.2 A migration that broke production

```
1. Roll back the application deploy first — the site comes back if the old
   code tolerates the new schema.
2. If the schema itself is wrong, write a forward migration. Do not run a
   down migration in production (MIGRATIONS.md §2).
3. If data was destroyed, this becomes 4.1.
```

**Estimated: 10 minutes for the code, longer if data is involved.**

### 4.3 Total database loss

Vendor account loss, or a region gone.

```
1. Provision a new Postgres instance.
2. Apply migrations from Git — the schema is code.
3. Restore the most recent logical dump from R2.
4. Accept the data gap since that dump, and reconcile: enquiry emails,
   payment provider records, and R2 objects all survive independently.
5. Repoint DATABASE_URL, redeploy, verify.
```

**Estimated: 1–3 hours.** This is the scenario the weekly dump exists for. It is also the one where reconciliation matters: enquiry notification emails are a second copy of every lead, and Razorpay holds an authoritative record of every payment.

### 4.4 Media loss

R2 versioning covers deletes. A full bucket loss means images are gone and must be re-uploaded from originals — which is why the client keeps the source photography, and why `PHOTOGRAPHY-BRIEF.md` says so.

Product rows survive; the page renders with the existing placeholder component rather than breaking.

### 4.5 Compromise

Different from every case above, because the backups may also be affected.

```
1. Rotate every secret immediately (ENVIRONMENT.md §6).
2. Invalidate all sessions — rotating AUTH_SECRET does this.
3. Establish when the compromise began, from audit_log and access logs.
4. Restore from a point BEFORE that time, not the latest.
5. Notify affected users. Under the DPDP Act 2023 this is an obligation,
   not a judgement call.
```

The audit log is what makes step 3 answerable, which is why every admin mutation writes one in the same transaction.

---

## 5. Maintenance mode

A static page served while a restore is in progress. It says what is happening, gives the WhatsApp number and phone, and does not pretend the site is fine.

Enabled by an environment flag and a redeploy, or at the edge. It is built before it is needed — writing a holding page during an incident is the wrong time to be choosing wording.

---

## 6. The restore drill

**Monthly. Diarised. Non-negotiable.**

```
1. Create a branch from a random point in the last 30 days.
2. Point a local or preview app at it.
3. Verify: the catalogue renders, enquiries are present, users can sign in,
   orders are intact.
4. Time it. Record the number.
5. If the measured time exceeds the RTO, the RTO is wrong or the process is.
   Fix one of them.
```

The drill is also the only way to notice that a backup silently stopped running three weeks ago — a failure mode that is invisible until the day it matters.

Once a quarter, run the same drill against the **logical dump in R2**, not the Neon branch. That is the path used in scenario 4.3, and it is the one most likely to have rotted.

---

## 7. Before anything destructive

Any operation that could lose data — a contract migration, a bulk update, a data cleanup — is preceded by:

```
1. A Neon branch taken immediately before, named for the change.
2. A dry run against that branch.
3. A stated rollback plan.
4. Execution during low traffic.
```

Scripts additionally call `assertNotProduction()` where they are not meant to run in production at all (`ENVIRONMENT.md` §5).

---

## 8. Responsibilities

| Task | Who | When |
|---|---|---|
| Verify backups are running | Engineering | Weekly |
| Restore drill | Engineering | Monthly |
| Dump-path drill | Engineering | Quarterly |
| Secret rotation | Engineering + client | Annually, or on exposure |
| Declare an incident | Whoever notices | Immediately |
| Decide to restore | Client, or engineering if unreachable | — |
| Notify customers | Client | As required by law |

**The client owns the accounts** (`OQ-069`). If recovery depends on credentials only we hold, the business has a single point of failure that is not technical.

---

## 9. Open questions

| ID | Question |
|---|---|
| `OQ-069` | Who owns the Neon, Vercel and R2 accounts |
| `OQ-073` | Where the offline secret record is kept, and who can reach it |
| `OQ-074` | Who is authorised to approve a production restore |
| `OQ-062` | DPDP data fiduciary contact, for breach notification |
