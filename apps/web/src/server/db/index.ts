/**
 * The Drizzle client. One instance per process.
 *
 * Nothing above `server/repositories` may import this file. The layering rule
 * is in docs/SYSTEM-DESIGN.md §2: a page calls a service, a service calls a
 * repository, a repository calls the database. Never skip, never reverse.
 */
import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env, isProduction } from "@/lib/env";
import * as schema from "./schema";

/**
 * Next.js reloads modules on every edit in development, which would open a new
 * pool each time and exhaust the database within a few minutes. Caching the
 * client on globalThis is the standard fix and is a no-op in production.
 */
const globalForDb = globalThis as unknown as {
  __burlaSql?: ReturnType<typeof postgres>;
};

function createClient() {
  return postgres(env.DATABASE_URL, {
    // Serverless functions are short-lived and numerous; a large per-instance
    // pool is how a Postgres connection limit gets hit. The pooled connection
    // string does the real multiplexing.
    max: isProduction ? 5 : 3,
    idle_timeout: 20,
    connect_timeout: 10,
    // Postgres NOTICE output is noise in application logs.
    onnotice: () => {},
  });
}

const client = globalForDb.__burlaSql ?? createClient();
if (!isProduction) globalForDb.__burlaSql = client;

export const db = drizzle(client, { schema, casing: "snake_case" });

export type Database = typeof db;
export { schema };
