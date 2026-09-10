/**
 * DEMONSTRATION SEED — MUST NEVER RUN IN PRODUCTION.
 *
 * Seeds the catalogue module's types and products: 9 types and 63 products,
 * named from the client's catalogue (2026-09-10). What the client has not
 * supplied — prices, pack sizes, descriptions, legal details — is absent, so
 * these rows are incomplete and must not reach production as they are.
 *
 * Three things stop it reaching a live site:
 *
 *   1. `assertNotProduction()` at the top of `seedDemo`.
 *   2. Every row is written with `is_sample = true`.
 *   3. `assertNoSampleData()` fails a production boot if any survive.
 *
 * ---------------------------------------------------------------------------
 * A deliberate compromise worth understanding before changing it
 * ---------------------------------------------------------------------------
 * These products are seeded as `published` with NO `product_details` row.
 *
 * That is a state the publish guard in `productService` will refuse to create,
 * and rightly: under the FSS Act and the Legal Metrology (Packaged
 * Commodities) Rules 2011, a published food product must carry ingredients,
 * allergens, net quantity, shelf life, manufacturer details and an FSSAI
 * number. We have none of those, and inventing them for a food product is not
 * something we will do — an invented allergen declaration is a safety issue,
 * not a content gap.
 *
 * So the seed writes what the current site shows — which is the legal fields
 * rendered as "to be confirmed" — and skips the service layer to do it. That
 * is precisely why this data may not go to production, and why the guards
 * above are three deep rather than one.
 * ---------------------------------------------------------------------------
 *
 * Source of the data: `@/data/catalog`. Importing it rather than copying it is
 * deliberate and temporary. It guarantees the seeded database renders exactly
 * what the site renders today, which is what makes the Phase 8 cutover diff
 * meaningful (docs/MIGRATIONS.md §13). The coupling ends when `catalog.ts` is
 * deleted at the end of Phase 8 — by which point the real catalogue exists and
 * this file is either retired or reduced to a small fixture for tests.
 */
import { isNull } from "drizzle-orm";
import {
  type Availability,
  type Product,
  products as sourceProducts,
  productTypes as sourceTypes,
} from "@/data/catalog";
import { assertNotProduction } from "@/lib/env";
import { type Database } from "../index";
import { purgeSampleData } from "../guards";
import {
  categories,
  inventoryMovements,
  productVariants,
  products,
} from "../schema";

/**
 * Stock levels chosen to reproduce the availability each sample variant
 * currently advertises. Availability is derived, not stored, so the seed sets
 * the inputs rather than the answer — docs/PRODUCT-DOMAIN.md §8.
 */
const STOCK_FOR: Record<Availability, { quantity: number; tracked: boolean }> = {
  in_stock: { quantity: 24, tracked: true },
  low_stock: { quantity: 3, tracked: true }, // at or below the threshold of 5
  out_of_stock: { quantity: 0, tracked: true },
  enquire_only: { quantity: 0, tracked: false },
};

/**
 * Search keywords: alternate spellings of names exactly as the catalogue
 * writes them, and nothing more — no synonyms, no claims. The catalogue
 * spells it "Vadialu"; "vadiyalu" is the other common spelling of the same
 * word, so a customer typing it still finds the products. Products not listed
 * have none.
 */
const VADIALU = ["vadiyalu", "vadalu"];
const KEYWORDS: Record<string, string[]> = {
  "rice-vadialu": VADIALU,
  "gummadi-vadialu": VADIALU,
  "minapa-vadialu": VADIALU,
  saggubiyyam: ["saggubiyam"],
};

export interface DemoSeedResult {
  typesInserted: number;
  productsInserted: number;
  variantsInserted: number;
  purged: { sampleCategories: number; sampleProducts: number };
}

export async function seedDemo(db: Database): Promise<DemoSeedResult> {
  assertNotProduction("seed demonstration data");

  // Start from a clean slate rather than upserting.
  //
  // The inventory ledger is append-only and stock is its running total, so an
  // upsert would have to reconcile movements to avoid doubling quantities on a
  // re-run. Deleting and rebuilding is simpler and cannot drift — and it is
  // safe precisely because this only ever runs outside production.
  const purged = await purgeSampleData(db);

  // --- types ---------------------------------------------------------------
  //
  // A type is a category with a parent. Its parent must already exist, which
  // is why the real seed runs first.

  const parentIdBySlug = new Map<string, string>();
  const rows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories)
    .where(isNull(categories.parentId));

  for (const row of rows) parentIdBySlug.set(row.slug, row.id);

  const typeIdByKey = new Map<string, string>();
  let typesInserted = 0;

  for (const type of sourceTypes) {
    const parentSlug = type.parentSlug;
    if (!parentSlug) continue;

    const parentId = parentIdBySlug.get(parentSlug);
    if (!parentId) {
      throw new Error(
        `Cannot seed type "${type.slug}": its parent category "${parentSlug}" ` +
          `does not exist. Run the real seed first.`,
      );
    }

    const [row] = await db
      .insert(categories)
      .values({
        parentId,
        name: type.name,
        slug: type.slug,
        shortName: type.shortName,
        // A type has no hero headline in the current design; the category
        // above it supplies one.
        heroHeadline: null,
        description: type.description,
        sortOrder: type.order,
        tone: type.tone,
        status: "published",
        publishedAt: new Date(),
        isSample: true,
      })
      .returning({ id: categories.id });

    if (row) {
      // Keyed by parent + slug: "mango" exists under both Pickles and
      // Dehydrated Fruits, and they are different rows.
      typeIdByKey.set(`${parentSlug}/${type.slug}`, row.id);
      typesInserted += 1;
    }
  }

  // --- products and variants ----------------------------------------------

  let productsInserted = 0;
  let variantsInserted = 0;

  for (const [index, source] of sourceProducts.entries()) {
    const categoryId = parentIdBySlug.get(source.categorySlug);
    if (!categoryId) {
      throw new Error(
        `Cannot seed product "${source.slug}": category ` +
          `"${source.categorySlug}" does not exist.`,
      );
    }

    const typeId = source.typeSlug
      ? typeIdByKey.get(`${source.categorySlug}/${source.typeSlug}`)
      : null;

    if (source.typeSlug && !typeId) {
      throw new Error(
        `Cannot seed product "${source.slug}": type "${source.typeSlug}" ` +
          `does not exist under "${source.categorySlug}".`,
      );
    }

    const [productRow] = await db
      .insert(products)
      .values({
        slug: source.slug,
        name: source.name,
        categoryId,
        typeId: typeId ?? null,
        shortDescriptor: source.shortDescriptor,
        description: source.description,
        status: "published",
        publishedAt: new Date(),
        featured: source.featured ?? false,
        sortOrder: index,
        tone: source.tone,
        searchKeywords: KEYWORDS[source.slug] ?? null,
        isSample: true,
      })
      .returning({ id: products.id });

    if (!productRow) continue;
    productsInserted += 1;

    // No product_details row. See the note at the top of this file: the legal
    // fields are unknown, and the site is built to say so.

    variantsInserted += await seedVariants(db, productRow.id, source);
  }

  return {
    typesInserted,
    productsInserted,
    variantsInserted,
    purged: {
      sampleCategories: purged.sampleCategories,
      sampleProducts: purged.sampleProducts,
    },
  };
}

async function seedVariants(
  db: Database,
  productId: string,
  source: Product,
): Promise<number> {
  let seeded = 0;

  for (const [index, variant] of source.variants.entries()) {
    const stock = STOCK_FOR[variant.availability];

    const [row] = await db
      .insert(productVariants)
      .values({
        productId,
        label: variant.label,
        sku: variant.sku,
        priceMinor: variant.priceMinor,
        // MRP and the GST rate are genuinely unknown for these sample
        // products. Left null and zero rather than filled with a plausible
        // number — a struck-through price that is not a real MRP is a Legal
        // Metrology problem, not a design flourish (OQ-044).
        mrpMinor: variant.mrpMinor ?? null,
        taxRateBp: 0,
        netWeightGrams: variant.netWeightGrams,
        trackInventory: stock.tracked,
        isDefault: variant.isDefault ?? false,
        sortOrder: index,
        status: "active",
      })
      .returning({ id: productVariants.id });

    if (!row) continue;
    seeded += 1;

    // Stock arrives through the ledger, never by setting the column. The
    // trigger applies the delta, so the seeded catalogue is consistent with
    // how every later stock change will work.
    if (stock.tracked && stock.quantity > 0) {
      await db.insert(inventoryMovements).values({
        variantId: row.id,
        delta: stock.quantity,
        reason: "restock",
        note: "Demonstration seed — opening stock.",
      });
    }
  }

  return seeded;
}

/**
 * Removes every demonstration row.
 *
 * Deliberately NOT guarded against production. Seeding demo data into
 * production is forbidden; *removing* it is the remediation the boot guard
 * tells you to run, and a guard that blocked the fix would be worse than no
 * guard at all.
 */
export async function purgeDemo(db: Database): Promise<void> {
  await purgeSampleData(db);
}
