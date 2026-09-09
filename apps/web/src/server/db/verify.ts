/**
 * Pre-deploy verification.
 *
 *   npm run db:verify
 *
 * Runs in CI after migrations and before the application is promoted, and is
 * the gate the launch checklist in docs/DEPLOYMENT.md §9 refers to. A non-zero
 * exit stops the deploy.
 *
 * It answers one question: is this database fit to be served to the public?
 */
import { config as loadEnv } from "dotenv";

loadEnv({ path: [".env.local", ".env"], quiet: true });

async function main(): Promise<void> {
  const { db } = await import("./index");
  const { env, isProduction } = await import("@/lib/env");
  const { countSampleData, assertNoSampleData } = await import("./guards");

  console.log(`APP_ENV=${env.APP_ENV}`);

  const report = await countSampleData(db);
  console.log(
    `Demonstration rows: ${report.sampleProducts} product(s), ` +
      `${report.sampleCategories} category/type row(s).`,
  );

  // Throws in production if anything is flagged is_sample.
  await assertNoSampleData(db);

  if (!isProduction) {
    console.log(
      "Not production — demonstration data is expected here and was not " +
        "treated as a failure.",
    );
    return;
  }

  console.log("No demonstration data. Database is fit to serve.");
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error("\nVerification failed.\n");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
