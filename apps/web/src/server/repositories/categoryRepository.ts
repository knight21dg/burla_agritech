/**
 * Every query against `categories`. Nothing else touches Drizzle for taxonomy.
 *
 * A type is a category with a parent — docs/PRODUCT-DOMAIN.md §2 — so one
 * repository serves both levels.
 *
 * The public methods filter to `status = 'published'` themselves rather than
 * taking a flag. A caller cannot forget to pass it, which is the point:
 * publish state is authorization, not a convenience filter
 * (docs/AUTHORIZATION.md §6).
 */
import "server-only";
import { and, asc, count, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/server/db";
import { categories, products } from "@/server/db/schema";
import type { Category, CategorySummary } from "@/types/catalog";

/** The columns every category read needs. Selected explicitly, never `*`. */
const categoryColumns = {
  id: categories.id,
  parentId: categories.parentId,
  name: categories.name,
  slug: categories.slug,
  shortName: categories.shortName,
  heroHeadline: categories.heroHeadline,
  description: categories.description,
  sortOrder: categories.sortOrder,
  tone: categories.tone,
} as const;

type CategoryRow = {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  shortName: string | null;
  heroHeadline: string | null;
  description: string | null;
  sortOrder: number;
  tone: Category["tone"];
};

/**
 * Maps a row to the read model.
 *
 * `shortName` and `heroHeadline` are nullable in the database but not in the
 * interface, because the UI always has something to render. The fallbacks are
 * here rather than in a component so every surface agrees.
 */
function toCategory(row: CategoryRow, parentSlug?: string): Category {
  return {
    slug: row.slug,
    name: row.name,
    shortName: row.shortName ?? row.name,
    order: row.sortOrder,
    heroHeadline: row.heroHeadline ?? "",
    description: row.description ?? "",
    tone: row.tone,
    ...(parentSlug ? { parentSlug } : {}),
  };
}

/** The ten top-level categories, in display order. */
export async function listTopLevel(): Promise<Category[]> {
  const rows = await db
    .select(categoryColumns)
    .from(categories)
    .where(and(isNull(categories.parentId), eq(categories.status, "published")))
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows.map((row) => toCategory(row));
}

/**
 * Top-level categories with their published product counts.
 *
 * One grouped query rather than one per card. `CategoryCard` currently calls
 * `productsByCategory().length` during render, which against a database would
 * be an N+1 that only appears after the cutover.
 *
 * A LEFT JOIN, so a category with no products still comes back — with zero,
 * which is exactly what the site will show until the real catalogue arrives.
 */
export async function listTopLevelWithCounts(): Promise<CategorySummary[]> {
  const rows = await db
    .select({
      ...categoryColumns,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(
      products,
      and(
        eq(products.categoryId, categories.id),
        eq(products.status, "published"),
      ),
    )
    .where(and(isNull(categories.parentId), eq(categories.status, "published")))
    .groupBy(
      categories.id,
      categories.parentId,
      categories.name,
      categories.slug,
      categories.shortName,
      categories.heroHeadline,
      categories.description,
      categories.sortOrder,
      categories.tone,
    )
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows.map((row) => ({
    ...toCategory(row),
    productCount: row.productCount,
  }));
}

/** A top-level category by slug. Undefined when it does not exist or is unpublished. */
export async function findBySlug(slug: string): Promise<Category | undefined> {
  const [row] = await db
    .select(categoryColumns)
    .from(categories)
    .where(
      and(
        eq(categories.slug, slug),
        isNull(categories.parentId),
        eq(categories.status, "published"),
      ),
    )
    .limit(1);

  return row ? toCategory(row) : undefined;
}

/** The types beneath one category, in display order. Empty when it has none. */
export async function listTypes(categorySlug: string): Promise<Category[]> {
  const parent = db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.slug, categorySlug), isNull(categories.parentId)));

  const rows = await db
    .select(categoryColumns)
    .from(categories)
    .where(
      and(
        inArray(categories.parentId, parent),
        eq(categories.status, "published"),
      ),
    )
    .orderBy(asc(categories.sortOrder), asc(categories.name));

  return rows.map((row) => toCategory(row, categorySlug));
}

/**
 * One type, addressed the way its URL addresses it.
 *
 * Both slugs are required because a type slug is only unique within its
 * parent: "mango" exists under both Pickles and Dehydrated Fruits, and they
 * are different rows with different descriptions.
 */
export async function findType(
  categorySlug: string,
  typeSlug: string,
): Promise<Category | undefined> {
  const parent = db
    .select({ id: categories.id })
    .from(categories)
    .where(and(eq(categories.slug, categorySlug), isNull(categories.parentId)));

  const [row] = await db
    .select(categoryColumns)
    .from(categories)
    .where(
      and(
        eq(categories.slug, typeSlug),
        inArray(categories.parentId, parent),
        eq(categories.status, "published"),
      ),
    )
    .limit(1);

  return row ? toCategory(row, categorySlug) : undefined;
}

/**
 * Every published type, with its parent slug.
 *
 * Used by the sitemap and by `generateStaticParams`, both of which need the
 * whole set rather than one category's worth. Self-join through a table alias,
 * so it stays one query.
 */
export async function listAllTypes(): Promise<Category[]> {
  const parent = alias(categories, "parent");

  const rows = await db
    .select({ ...categoryColumns, parentSlug: parent.slug })
    .from(categories)
    .innerJoin(parent, eq(parent.id, categories.parentId))
    .where(
      and(isNotNull(categories.parentId), eq(categories.status, "published")),
    )
    .orderBy(asc(parent.sortOrder), asc(categories.sortOrder));

  return rows.map((row) => toCategory(row, row.parentSlug));
}
