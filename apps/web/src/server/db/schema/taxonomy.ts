/**
 * Categories and types.
 *
 * A type is a category with a parent. One table, two levels — see
 * docs/PRODUCT-DOMAIN.md §2 for why they are the same thing rather than two
 * entities that happen to look alike.
 *
 * Two rules cannot be expressed as Drizzle column definitions and are created
 * by hand in the migration that follows the generated one:
 *
 *   1. Slugs are unique WITHIN a parent, not globally, so "mango" can exist
 *      under both Pickles and Dehydrated Fruits. Enforced by a unique index on
 *      (COALESCE(parent_id, <nil uuid>), slug).
 *   2. Depth is capped at two. A type cannot have a type. Enforced by a
 *      BEFORE INSERT OR UPDATE trigger, because Postgres CHECK constraints
 *      cannot contain a subquery.
 *
 * Both are asserted by tests. Do not "tidy them away" — DATABASE-DESIGN.md §3.
 */
import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { categoryStatusEnum } from "./enums";
import { media } from "./media";

export const categories = pgTable(
  "categories",
  {
    id: primaryId(),

    /** NULL means a top-level category. Set means this row is a type. */
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "restrict",
    }),

    name: text("name").notNull(),

    /** Unique within the parent — see the note at the top of this file. */
    slug: text("slug").notNull(),

    /** For the header rail, where the full name does not fit. */
    shortName: text("short_name"),

    heroHeadline: text("hero_headline"),
    description: text("description"),

    heroImageId: uuid("hero_image_id").references(() => media.id, {
      onDelete: "set null",
    }),

    sortOrder: integer("sort_order").notNull().default(0),
    status: categoryStatusEnum("status").notNull().default("draft"),

    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),

    publishedAt: timestamp("published_at", { withTimezone: true }),

    ...timestamps,
  },
  (table) => [
    // Navigation and the type chips on a category page: both read children of
    // one parent in display order.
    index("categories_parent_sort_idx").on(table.parentId, table.sortOrder),
    index("categories_status_idx").on(table.status),

    /**
     * Slugs are unique within a parent, not globally.
     *
     * A plain UNIQUE(parent_id, slug) does not work: in Postgres, NULL is not
     * equal to NULL, so two top-level categories could both take the slug
     * "pickles". COALESCE to the nil UUID gives every top-level row the same
     * sentinel parent, which restores the uniqueness we actually want.
     */
    uniqueIndex("categories_parent_slug_key").on(
      sql`coalesce(${table.parentId}, '00000000-0000-0000-0000-000000000000'::uuid)`,
      table.slug,
    ),

    // A category cannot be its own parent. The two-level depth rule needs a
    // trigger (a CHECK cannot contain a subquery); this is the cheap half.
    check("categories_no_self_parent", sql`${table.parentId} <> ${table.id}`),
    check(
      "categories_published_has_date",
      sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`,
    ),
  ],
);

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_parent",
  }),
  children: many(categories, { relationName: "category_parent" }),
  heroImage: one(media, {
    fields: [categories.heroImageId],
    references: [media.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
