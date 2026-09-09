import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so it does not get .env.local for free.
loadEnv({ path: [".env.local", ".env"], quiet: true });

/**
 * Migrations use the DIRECT connection, not the pooler.
 *
 * DDL and advisory locks do not survive a transaction pooler reliably, which
 * is the sort of failure that shows up once, in production, halfway through a
 * migration. docs/MIGRATIONS.md §2.
 */
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

// `generate` diffs the schema files and never opens a connection, so it must
// work with no database configured — that is what lets migration SQL be
// written and reviewed before any instance exists. Every other verb needs one.
const OFFLINE_VERBS = new Set(["generate", "check", "up"]);
const verb = process.argv[2];
const needsConnection = !verb || !OFFLINE_VERBS.has(verb);

if (!url && needsConnection) {
  throw new Error(
    `drizzle-kit ${verb ?? ""} needs a database connection, but neither ` +
      "DATABASE_URL_UNPOOLED nor DATABASE_URL is set.\n" +
      "Copy .env.example to .env.local and fill it in — see docs/ENVIRONMENT.md.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./src/server/db/migrations",
  // Non-null asserted: the guard above has already failed loudly for every
  // verb that actually opens a connection.
  dbCredentials: { url: url ?? "" },
  casing: "snake_case",
  strict: true,
  verbose: true,
});
