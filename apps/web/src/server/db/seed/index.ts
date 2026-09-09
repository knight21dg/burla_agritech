/**
 * Seed CLI.
 *
 *   npm run db:seed                    real data only — safe in production
 *   npm run db:seed -- --demo          real data, then the demonstration catalogue
 *   npm run db:seed -- --purge-demo    remove every demonstration row
 *   npm run db:seed -- --status        report without writing anything
 *
 * The default is deliberately the safe one. Getting demonstration products
 * into a live catalogue should require typing `--demo`, not forgetting a flag.
 */
import { config as loadEnv } from "dotenv";

// Runs as a plain Node script, outside Next.js, so .env.local is not loaded
// for it automatically. This must happen before anything imports lib/env.
loadEnv({ path: [".env.local", ".env"], quiet: true });

async function main(): Promise<void> {
  // Imported after the environment is loaded: lib/env parses at import time,
  // and a static import would run before loadEnv above.
  const { db } = await import("../index");
  const { env, isProduction } = await import("@/lib/env");
  const { countSampleData } = await import("../guards");
  const { seedReal } = await import("./real");
  const { purgeDemo, seedDemo } = await import("./demo");

  const args = new Set(process.argv.slice(2));
  const wantsDemo = args.has("--demo");
  const wantsPurge = args.has("--purge-demo");
  const statusOnly = args.has("--status");

  console.log(`APP_ENV=${env.APP_ENV}`);

  if (statusOnly) {
    const report = await countSampleData(db);
    console.log(
      `Demonstration rows: ${report.sampleProducts} product(s), ` +
        `${report.sampleCategories} category/type row(s).`,
    );
    return;
  }

  if (wantsPurge) {
    await purgeDemo(db);
    const after = await countSampleData(db);
    console.log(
      `Purged. Remaining demonstration rows: ${after.total} (expected 0).`,
    );
    return;
  }

  const real = await seedReal(db);
  console.log(
    `Real seed: ${real.categoriesInserted} categories inserted, ` +
      `${real.categoriesUpdated} updated, site settings written.`,
  );

  if (!wantsDemo) {
    console.log(
      "\nDemonstration catalogue NOT seeded. Pass --demo if you want it.\n" +
        "The site will show categories with no products until real product\n" +
        "data arrives (OQ-016).",
    );
    return;
  }

  // seedDemo asserts this too. Repeated here so the message names the flag
  // the operator actually typed.
  if (isProduction) {
    throw new Error(
      "--demo is refused when APP_ENV=production.\n" +
        "Every product it would create was invented to demonstrate the " +
        "interface and must not be published as fact.",
    );
  }

  const demo = await seedDemo(db);
  console.log(
    `Demo seed: ${demo.typesInserted} types, ${demo.productsInserted} products, ` +
      `${demo.variantsInserted} variants.` +
      (demo.purged.sampleProducts > 0
        ? ` (replaced ${demo.purged.sampleProducts} existing demo products)`
        : ""),
  );
  console.log(
    "\n⚠  This catalogue is DEMONSTRATION DATA. Every name, price, SKU and\n" +
      "   description was invented by us. It is flagged is_sample and a\n" +
      "   production boot will refuse to serve it.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error("\nSeed failed.\n");
    console.error(error);
    process.exit(1);
  });
