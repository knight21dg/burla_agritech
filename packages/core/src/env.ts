/**
 * The only module in this codebase that reads `process.env`.
 *
 * Everything is parsed once, at import time, so a missing or malformed
 * variable is a startup crash with a readable message rather than a surprise
 * inside a request. See docs/ENVIRONMENT.md.
 *
 * Server variables are guarded by `server-only`: a client component that
 * imports this file fails the build instead of shipping a secret to the
 * browser. Client variables live in `env.client.ts`.
 */
import "server-only";
import { z } from "zod";

/** Variables that must be present for the process to be able to do anything. */
const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "preview", "production"]).default("development"),

  // Pooled connection for the application; direct connection for migrations.
  // DDL and advisory locks do not survive a transaction pooler reliably.
  DATABASE_URL: z.string().url(),
  DATABASE_URL_UNPOOLED: z.string().url().optional(),
});

/**
 * Variables required only once the feature that needs them is switched on.
 * Optional here, and asserted at the point of use, so Phase 3 does not
 * require a Resend key to exist before there is any email to send.
 */
const laterSchema = z.object({
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: z.string().url().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  ENQUIRY_NOTIFY_TO: z.string().email().optional(),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().url().optional(),

  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  TURNSTILE_SECRET_KEY: z.string().optional(),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  SENTRY_DSN: z.string().optional(),

  /** Rotating salt for hashing IP addresses. Raw IPs are never stored. */
  IP_HASH_SALT: z.string().min(16).optional(),
});

const serverSchema = baseSchema.merge(laterSchema).superRefine((value, ctx) => {
  if (value.APP_ENV !== "production") return;

  // Things that are merely recommended in development are mandatory in
  // production. Failing here means a bad deploy never starts, which is the
  // whole point of validating at boot.
  const requiredInProduction = [
    "AUTH_SECRET",
    "AUTH_URL",
    "IP_HASH_SALT",
  ] as const;

  for (const key of requiredInProduction) {
    if (!value[key]) {
      ctx.addIssue({
        code: "custom",
        path: [key],
        message: `${key} is required when APP_ENV=production`,
      });
    }
  }

  // `env.client.ts` falls back to a sensible default for local development.
  // In production that fallback would silently emit wrong canonical URLs and
  // a wrong sitemap, which nobody notices until the site is indexed badly —
  // so production must set it explicitly.
  for (const key of ["NEXT_PUBLIC_SITE_URL", "NEXT_PUBLIC_WHATSAPP_NUMBER"]) {
    if (!process.env[key]) {
      ctx.addIssue({
        code: "custom",
        path: [key],
        message: `${key} must be set explicitly when APP_ENV=production, not left to the development fallback`,
      });
    }
  }
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  // Deliberately not `throw new Error(JSON.stringify(...))`: the point is a
  // message a human can act on at 2am, listing every problem at once rather
  // than one per restart.
  const lines = parsed.error.issues.map(
    (issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
  throw new Error(
    `Invalid environment configuration.\n${lines.join("\n")}\n\n` +
      `See .env.example and docs/ENVIRONMENT.md.`,
  );
}

export const env = parsed.data;

export const isProduction = env.APP_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/**
 * Guard for anything that writes, resets or seeds.
 *
 * Two checks, because one is not enough. The first catches the obvious case.
 * The second catches the genuinely dangerous one: a production connection
 * string pasted into a local .env, where APP_ENV still says development and
 * the first check would happily pass.
 *
 * docs/ENVIRONMENT.md §5.
 */
export function assertNotProduction(operation: string): void {
  if (isProduction) {
    throw new Error(`Refusing to ${operation} against production (APP_ENV=production).`);
  }

  const url = env.DATABASE_URL;
  const looksProduction = /(^|[^a-z])prod(uction)?([^a-z]|$)/i.test(url);
  if (looksProduction) {
    throw new Error(
      `Refusing to ${operation}: DATABASE_URL looks like a production database ` +
        `but APP_ENV is "${env.APP_ENV}". If this is genuinely not production, ` +
        `rename the database or branch.`,
    );
  }
}
