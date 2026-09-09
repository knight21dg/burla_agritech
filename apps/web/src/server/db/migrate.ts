/**
 * Applies pending migrations.
 *
 * Run by CI before the application deploys, never after and never concurrently
 * across instances — docs/DEPLOYMENT.md §3.
 *
 *   npm run db:migrate --workspace=@burla/web
 */
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import postgres from "postgres";

// This runs as a plain Node script, outside Next.js, so .env.local is not
// loaded for it automatically.
loadEnv({ path: [".env.local", ".env"], quiet: true });

/** Any 64-bit constant; it only has to be the same in every runner. */
const MIGRATION_LOCK_ID = 4_812_007n;

async function main(): Promise<void> {
  // The DIRECT connection. DDL and advisory locks do not survive a transaction
  // pooler reliably, and finding that out halfway through a migration is the
  // worst possible time.
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL_UNPOOLED (or DATABASE_URL) must be set.\n" +
        "Copy .env.example to .env.local — see docs/ENVIRONMENT.md.",
    );
  }

  if (!process.env.DATABASE_URL_UNPOOLED) {
    console.warn(
      "! DATABASE_URL_UNPOOLED is not set; falling back to DATABASE_URL.\n" +
        "  If that is a pooled connection, this migration may fail partway.",
    );
  }

  // max: 1 — migrations are strictly sequential, and a pool would let the
  // advisory lock and the DDL land on different connections.
  const client = postgres(url, { max: 1, onnotice: () => {} });
  const db = drizzle(client);

  const target = new URL(url);
  console.log(`Migrating ${target.pathname.replace("/", "")} on ${target.host}`);

  try {
    // Two deploys racing must not both run the same migration. The lock is
    // session-scoped and released when the connection closes, including on a
    // crash, so a failed run cannot leave it held.
    await db.execute(sql`SELECT pg_advisory_lock(${MIGRATION_LOCK_ID})`);

    const started = Date.now();
    await migrate(db, { migrationsFolder: "./src/server/db/migrations" });
    console.log(`Migrations applied in ${Date.now() - started}ms`);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  console.error("\nMigration failed.\n");
  console.error(error);
  // A non-zero exit is what stops the deploy pipeline. Do not swallow it.
  process.exit(1);
});
