/**
 * Cutover parity check — TEMPORARY, and deliberately so.
 *
 *   npm run db:parity --workspace=@burla/web
 *
 * For the same seeded data, does the service layer return exactly what
 * `data/catalog.ts` returns? That is the Phase 8 acceptance test
 * (docs/MIGRATIONS.md §13) checked at the data level, where a mismatch names
 * the field, rather than as an HTML diff later, where it names a line number.
 *
 * Requires a database seeded with `npm run db:seed -- --demo`, because it
 * compares against the demonstration catalogue by definition.
 *
 * This file dies with `catalog.ts` at the end of Phase 8. It has nothing to
 * compare against afterwards, and keeping it would freeze the service layer
 * against sample data it no longer serves.
 *
 * `.mts` rather than `.ts` because it uses top-level await, which tsx will not
 * transform under the CommonJS output the project tsconfig implies.
 */
import { config as loadEnv } from "dotenv";
import type { Product } from "@/types/catalog";

// Static ESM imports are hoisted above any statement, so a plain
// `import "@/server/db"` would parse the environment before dotenv had loaded
// it. Everything that reads config is therefore imported dynamically, after.
loadEnv({ path: [".env.local", ".env"], quiet: true });

const catalog = await import("@/data/catalog");
const { catalogService, settingsService } = await import("@/server/services");
const { defaultVariant, productHref } = await import("@/lib/catalog");

let passed = 0;
let failed = 0;

function norm(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value ?? null));
}

function check(label: string, expected: unknown, actual: unknown): void {
  const a = JSON.stringify(norm(expected));
  const b = JSON.stringify(norm(actual));
  if (a === b) {
    console.log(`  ok    ${label}`);
    passed += 1;
    return;
  }
  console.error(`  FAIL  ${label}`);
  console.error(`        catalog.ts : ${a.slice(0, 320)}`);
  console.error(`        service    : ${b.slice(0, 320)}`);
  failed += 1;
}

function assert(label: string, condition: boolean, detail = ""): void {
  if (condition) {
    console.log(`  ok    ${label}`);
    passed += 1;
  } else {
    console.error(`  FAIL  ${label} ${detail}`);
    failed += 1;
  }
}

/** catalog.ts orders categories by array position; the service by sort_order. */
const bySlug = (list: { slug: string }[]) =>
  [...list].sort((x, y) => x.slug.localeCompare(y.slug));

console.log("--- taxonomy ---");

const dbCategories = await catalogService.listCategories();
check(
  "listCategories matches catalog.categories",
  bySlug(catalog.categories),
  bySlug(dbCategories),
);

assert(
  "category order is preserved",
  dbCategories.map((c) => c.slug).join(",") ===
    catalog.categories.map((c) => c.slug).join(","),
  `\n        got: ${dbCategories.map((c) => c.slug).join(",")}`,
);

for (const category of catalog.categories) {
  const expected = catalog.typesOf(category.slug);
  const actual = await catalogService.listTypes(category.slug);
  check(`listTypes(${category.slug})`, bySlug(expected), bySlug(actual));
}

check(
  "getCategory(pickles)",
  catalog.categoryBySlug("pickles"),
  await catalogService.getCategory("pickles"),
);

check(
  "getCategory(nonexistent) is undefined",
  undefined,
  await catalogService.getCategory("no-such-category"),
);

// The case that a single global slug index would have broken.
const pickleMango = await catalogService.getType("pickles", "mango");
const fruitMango = await catalogService.getType("dehydrated-fruits", "mango");
check("getType(pickles, mango)", catalog.typeBySlug("pickles", "mango"), pickleMango);
check(
  "getType(dehydrated-fruits, mango)",
  catalog.typeBySlug("dehydrated-fruits", "mango"),
  fruitMango,
);
assert(
  "the two 'mango' types are different rows",
  pickleMango?.description !== fruitMango?.description,
);

console.log("\n--- products ---");

const dbProducts = await catalogService.listProducts();
assert(
  `listProducts returns ${catalog.products.length}`,
  dbProducts.length === catalog.products.length,
  `got ${dbProducts.length}`,
);

// ids are UUIDs in the database and "p1".. in catalog.ts, so compare
// everything else.
const stripId = (p: Product | catalog.Product) => {
  const { id, variants, ...rest } = p as Product;
  return {
    ...rest,
    variants: variants.map(({ id: _vid, ...v }) => v),
  };
};

for (const source of catalog.products) {
  const actual = await catalogService.getProduct(source.slug);
  if (!actual) {
    console.error(`  FAIL  getProduct(${source.slug}) returned undefined`);
    failed += 1;
    continue;
  }
  check(`getProduct(${source.slug})`, stripId(source), stripId(actual));
}

console.log("\n--- listings ---");

for (const category of catalog.categories) {
  const expected = catalog.productsByCategory(category.slug).map(stripId);
  const actual = (await catalogService.listByCategory(category.slug)).map(stripId);
  check(`listByCategory(${category.slug}) [${expected.length}]`, expected, actual);
}

for (const type of catalog.productTypes) {
  const parent = type.parentSlug!;
  const expected = catalog.productsByType(parent, type.slug).map(stripId);
  const actual = (await catalogService.listByType(parent, type.slug)).map(stripId);
  check(`listByType(${parent}/${type.slug}) [${expected.length}]`, expected, actual);
}

check(
  "listFeatured",
  catalog.featuredProducts().map(stripId),
  (await catalogService.listFeatured()).map(stripId),
);

console.log("\n--- product page composition ---");

for (const slug of ["mango-pickle", "turmeric-powder", "cashews"]) {
  const page = await catalogService.getProductPage(slug);
  const source = catalog.productBySlug(slug)!;

  if (!page) {
    console.error(`  FAIL  getProductPage(${slug}) undefined`);
    failed += 1;
    continue;
  }

  const expectedTrail = catalog.trailFor(source);
  check(`trail(${slug}).category`, expectedTrail.category, page.trail.category);
  check(`trail(${slug}).type`, expectedTrail.type, page.trail.type);

  const expectedRelated = catalog.relatedProducts(source).map((p) => p.slug);
  const actualRelated = page.related.map((p) => p.slug);
  check(`related(${slug})`, expectedRelated, actualRelated);
}

console.log("\n--- helpers ---");

const sampleProduct = (await catalogService.getProduct("turmeric-powder"))!;
const sampleSource = catalog.productBySlug("turmeric-powder")!;

check(
  "defaultVariant picks the same pack size",
  catalog.defaultVariant(sampleSource).label,
  defaultVariant(sampleProduct).label,
);
check(
  "productHref",
  catalog.productHref(sampleSource),
  productHref(sampleProduct),
);

console.log("\n--- availability ---");

const availabilityFromDb = new Map<string, string>();
for (const product of dbProducts) {
  for (const variant of product.variants) {
    availabilityFromDb.set(variant.sku, variant.availability);
  }
}
let availabilityMismatches = 0;
for (const product of catalog.products) {
  for (const variant of product.variants) {
    if (availabilityFromDb.get(variant.sku) !== variant.availability) {
      availabilityMismatches += 1;
      console.error(
        `        ${variant.sku}: catalog=${variant.availability} db=${availabilityFromDb.get(variant.sku)}`,
      );
    }
  }
}
assert(
  "every variant derives the same availability",
  availabilityMismatches === 0,
  `${availabilityMismatches} mismatch(es)`,
);

console.log("\n--- search ---");

for (const term of ["mango", "pickle", "millet", "turmeric"]) {
  const expected = catalog.searchProducts(term).map((p) => p.slug).sort();
  const actual = (await catalogService.search(term)).products
    .map((p) => p.slug)
    .sort();
  const missing = expected.filter((slug) => !actual.includes(slug));
  assert(
    `search("${term}") finds everything catalog.ts finds (${expected.length})`,
    missing.length === 0,
    `missing: ${missing.join(", ")}`,
  );
}

const fuzzy = await catalogService.search("vadiyaalu");
assert(
  "search survives a misspelling that catalog.ts cannot handle",
  fuzzy.products.length > 0 && catalog.searchProducts("vadiyaalu").length === 0,
  `db=${fuzzy.products.length} catalog=${catalog.searchProducts("vadiyaalu").length}`,
);

const regional = await catalogService.search("avakaya");
assert(
  "search finds a product by its Telugu name",
  regional.products.some((p) => p.slug === "mango-pickle"),
);

const tooShort = await catalogService.search("m");
assert("a one-character query returns nothing, not an error", tooShort.total === 0);

console.log("\n--- category counts (the N+1 the cutover would have created) ---");

const summaries = await catalogService.listCategoriesWithCounts();
let countMismatches = 0;
for (const summary of summaries) {
  const expected = catalog.productsByCategory(summary.slug).length;
  if (summary.productCount !== expected) {
    countMismatches += 1;
    console.error(
      `        ${summary.slug}: catalog=${expected} db=${summary.productCount}`,
    );
  }
}
assert("counts match, in one query", countMismatches === 0);

console.log("\n--- sitemap rule ---");

const indexable = await catalogService.listIndexableTypePaths();
const expectedIndexable = catalog.productTypes
  .filter((t) => catalog.productsByType(t.parentSlug!, t.slug).length > 1)
  .map((t) => `${t.parentSlug}/${t.slug}`)
  .sort();
check(
  "only type pages with more than one product are indexable",
  expectedIndexable,
  indexable.map((t) => `${t.categorySlug}/${t.typeSlug}`).sort(),
);

console.log("\n--- settings ---");

const identity = await settingsService.getBusinessIdentity();
assert("GSTIN comes from the database", identity.gstin === "37ABHFB2458F1ZH");
assert("two partners", identity.partners.length === 2);
assert(
  "FSSAI is undefined, not invented",
  identity.fssaiLicenceNumber === undefined,
);
assert(
  "grievance officer is undefined, not invented",
  identity.grievanceOfficerName === undefined,
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
