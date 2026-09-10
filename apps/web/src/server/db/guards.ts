/**
 * Guards that stand between demonstration data and a live site.
 *
 * The catalogue on the site — 9 product types and 63 products — is named
 * from the client's catalogue (2026-09-10), but carries no prices, pack
 * sizes, descriptions or legally required details yet. Rows seeded from it are
 * flagged `is_sample` so they cannot reach production until those exist; a
 * comment saying "remember to remove this" would not be a control.
 */
import "server-only";
import { count, eq, inArray } from "drizzle-orm";
import { isProduction } from "@/lib/env";
import { type Database } from "./index";
import {
  categories,
  inventoryMovements,
  productVariants,
  products,
} from "./schema";

export interface SampleDataReport {
  sampleCategories: number;
  sampleProducts: number;
  total: number;
}

/** Counts rows the demonstration seed created. */
export async function countSampleData(db: Database): Promise<SampleDataReport> {
  const [categoryRow] = await db
    .select({ n: count() })
    .from(categories)
    .where(eq(categories.isSample, true));

  const [productRow] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.isSample, true));

  const sampleCategories = categoryRow?.n ?? 0;
  const sampleProducts = productRow?.n ?? 0;

  return {
    sampleCategories,
    sampleProducts,
    total: sampleCategories + sampleProducts,
  };
}

/**
 * Throws if production holds any demonstration data.
 *
 * Called by the health check and by the pre-deploy verification step, so a
 * production deploy that would serve incomplete product information fails
 * loudly rather than going live looking fine.
 *
 * Outside production this is a no-op: preview and development are *supposed*
 * to have demo data.
 */
export async function assertNoSampleData(db: Database): Promise<void> {
  if (!isProduction) return;

  const report = await countSampleData(db);
  if (report.total === 0) return;

  throw new Error(
    `Refusing to run: production contains demonstration data — ` +
      `${report.sampleProducts} product(s) and ${report.sampleCategories} ` +
      `category/type row(s) flagged is_sample.\n` +
      `Those rows have no prices, pack sizes, descriptions or legal ` +
      `details and must not be published as they are.\n` +
      `Remove them with: npm run db:seed -- --purge-demo\n` +
      `See docs/DATABASE-DESIGN.md §10.`,
  );
}

/**
 * Deletes every row the demonstration seed created.
 *
 * Order matters, and each step is forced by a foreign key that is deliberately
 * restrictive:
 *
 *   1. Inventory movements, because `variant_id` is ON DELETE RESTRICT — the
 *      business ledger must survive a product being removed. Migration 0003
 *      permits this DELETE only for sample products.
 *   2. Products, which cascades to variants, details and images.
 *   3. Types, because `categories.parent_id` and `products.category_id` are
 *      RESTRICT, so a type cannot go while a product still points at it.
 *
 * The ten top-level categories are client-derived and are never touched.
 */
export async function purgeSampleData(db: Database): Promise<SampleDataReport> {
  const before = await countSampleData(db);

  await db.delete(inventoryMovements).where(
    inArray(
      inventoryMovements.variantId,
      db
        .select({ id: productVariants.id })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(eq(products.isSample, true)),
    ),
  );

  await db.delete(products).where(eq(products.isSample, true));
  await db.delete(categories).where(eq(categories.isSample, true));

  return before;
}
