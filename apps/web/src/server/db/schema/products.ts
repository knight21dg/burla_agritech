/**
 * Products, their pack sizes, their legally required detail, and their images.
 *
 * Money is integer minor units — paise — everywhere. No float, no numeric
 * arithmetic in application code. docs/DATABASE-DESIGN.md §1.
 */
import { type SQL, relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { primaryId, timestamps, tsvector } from "./_shared";
import {
  productImageRoleEnum,
  productStatusEnum,
  toneEnum,
  variantStatusEnum,
  vegNonVegEnum,
} from "./enums";
import { media } from "./media";
import { categories } from "./taxonomy";

// --- products ---------------------------------------------------------------

export const products = pgTable(
  "products",
  {
    id: primaryId(),

    /** Permanent. Changing it writes a row into `redirects`. */
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),

    /**
     * Always the TOP-LEVEL category, even when `typeId` is set.
     *
     * Denormalised on purpose: breadcrumbs, the category listing and the
     * "other ranges" block all need the top-level category on every render,
     * and walking the parent chain per row would be a recursive query per
     * product. A trigger keeps the two columns honest.
     */
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),

    /** The type, where the category has one. Must be a child of categoryId. */
    typeId: uuid("type_id").references(() => categories.id, {
      onDelete: "restrict",
    }),

    /** Card and product-page subtitle. Capped so cards cannot break. */
    shortDescriptor: varchar("short_descriptor", { length: 90 }).notNull(),
    description: text("description").notNull(),

    status: productStatusEnum("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),

    /** Card tint and placeholder treatment, until real photography exists. */
    tone: toneEnum("tone").notNull().default("cream"),

    /**
     * True for products seeded by the demonstration seed. Their names are the
     * client's (catalogue of 2026-09-10), but no prices, pack sizes,
     * descriptions or legally required details exist for them, so none may
     * reach production as they are. `assertNoSampleData()` refuses to let
     * them.
     */
    isSample: boolean("is_sample").notNull().default(false),

    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),

    /**
     * Alternate spellings of the names — "vadiyalu" for the catalogue's
     * "Vadialu". Feeds the search vector, so a customer who spells the Telugu
     * word another way still finds the product.
     */
    searchKeywords: text("search_keywords").array(),

    /**
     * Maintained by Postgres, never written by application code.
     *
     * Weighting: the name matters most, then the descriptor and the regional
     * keywords, then the body copy. So "vadialu" in a product name outranks
     * "vadialu" mentioned in a paragraph.
     *
     * Everything in a generated expression must be IMMUTABLE, which rules out
     * two things that look fine: the one-argument `to_tsvector` (STABLE, hence
     * the explicit 'english'), and `array_to_string` (also STABLE). The latter
     * is replaced by `burla_keywords_text`, created in migration 0000.
     *
     * Category and type names are deliberately absent: a generated column can
     * only see its own row, and they live in `categories`. The search query
     * matches those through the join instead. docs/API-DESIGN.md §4.
     */
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      (): SQL => sql`
        setweight(to_tsvector('english', coalesce(${products.name}, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(${products.shortDescriptor}, '')), 'B') ||
        setweight(to_tsvector('english', burla_keywords_text(${products.searchKeywords})), 'B') ||
        setweight(to_tsvector('english', coalesce(${products.description}, '')), 'C')
      `,
    ),

    publishedAt: timestamp("published_at", { withTimezone: true }),

    ...timestamps,
  },
  (table) => [
    // The category listing: one category, published only, in display order.
    index("products_category_status_sort_idx").on(
      table.categoryId,
      table.status,
      table.sortOrder,
    ),
    // The type listing.
    index("products_type_status_idx").on(table.typeId, table.status),
    // The homepage rail. Partial, because featured products are a handful.
    index("products_featured_idx")
      .on(table.status, table.sortOrder)
      .where(sql`${table.featured}`),
    // Full-text search. GIN, because the vector holds many lexemes per row.
    index("products_search_vector_idx").using("gin", table.searchVector),
    // A published product must have a publication date. Enforced here rather
    // than trusted to the service, because the sitemap and the "new arrivals"
    // ordering both depend on it being present.
    check(
      "products_published_has_date",
      sql`${table.status} <> 'published' OR ${table.publishedAt} IS NOT NULL`,
    ),
    // A product cannot be its own type layer, and a type must differ from the
    // category. The full parent-child rule needs a trigger; this catches the
    // degenerate case cheaply.
    check(
      "products_type_differs_from_category",
      sql`${table.typeId} IS NULL OR ${table.typeId} <> ${table.categoryId}`,
    ),
  ],
);

// --- product_variants -------------------------------------------------------

export const productVariants = pgTable(
  "product_variants",
  {
    id: primaryId(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    /** "250g", "500g", "1kg". Sizes are rows, never a comma-separated string. */
    label: text("label").notNull(),
    sku: text("sku").notNull().unique(),

    /** Paise. Integer. */
    priceMinor: integer("price_minor").notNull(),
    /** Maximum retail price, inclusive of taxes. Null when there is no MRP. */
    mrpMinor: integer("mrp_minor"),
    /** GST in basis points — 500 = 5%. Varies by food category. */
    taxRateBp: integer("tax_rate_bp").notNull().default(0),

    /** Shipping, and the legal net-quantity display. */
    netWeightGrams: integer("net_weight_grams").notNull(),

    /**
     * The running total of `inventory_movements`. Never set blind: every
     * change writes a movement row first. docs/DATABASE-DESIGN.md §7.
     */
    stockQuantity: integer("stock_quantity").notNull().default(0),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),

    /**
     * False when the business does not track stock for this variant — bulk and
     * wholesale lines, and the whole catalogue if OQ-001 lands on
     * enquiry-only. Drives the `enquire_only` availability the frontend
     * already renders.
     */
    trackInventory: boolean("track_inventory").notNull().default(true),

    status: variantStatusEnum("status").notNull().default("active"),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),

    ...timestamps,
  },
  (table) => [
    index("product_variants_product_sort_idx").on(
      table.productId,
      table.sortOrder,
    ),
    // One default variant per product — the one the product page opens on.
    uniqueIndex("product_variants_one_default_idx")
      .on(table.productId)
      .where(sql`${table.isDefault}`),
    // The low-stock dashboard. Partial, so the index stays tiny.
    index("product_variants_low_stock_idx")
      .on(table.productId)
      .where(
        sql`${table.trackInventory} AND ${table.stockQuantity} <= ${table.lowStockThreshold}`,
      ),

    // The money and quantity rules, in the database rather than only in Zod.
    // Application validation has bugs; constraints do not.
    check("product_variants_price_non_negative", sql`${table.priceMinor} >= 0`),
    check(
      "product_variants_mrp_at_least_price",
      sql`${table.mrpMinor} IS NULL OR ${table.mrpMinor} >= ${table.priceMinor}`,
    ),
    check("product_variants_stock_non_negative", sql`${table.stockQuantity} >= 0`),
    check("product_variants_weight_positive", sql`${table.netWeightGrams} > 0`),
    check(
      "product_variants_tax_rate_sane",
      sql`${table.taxRateBp} >= 0 AND ${table.taxRateBp} <= 10000`,
    ),
  ],
);

// --- product_details --------------------------------------------------------

/**
 * The legally significant fields. One row per product.
 *
 * Separate from `products` because they are read only on the product page and
 * change on a different cadence from name and price — and because publishing
 * checks this table as a unit.
 *
 * Columns are nullable at the database level and required at publish time.
 * That is deliberate: a half-entered draft must be savable, but a published
 * product missing any of them is non-compliant under the FSS Act and the
 * Legal Metrology (Packaged Commodities) Rules 2011. The publish guard lives
 * in the service and is asserted by an integration test.
 *
 * This is our reading of the applicable rules. The client must have it
 * confirmed by their own advisor — OQ-003.
 */
export const productDetails = pgTable("product_details", {
  productId: uuid("product_id")
    .primaryKey()
    .references(() => products.id, { onDelete: "cascade" }),

  /** FSS labelling: descending by weight. */
  ingredients: text("ingredients"),
  /** FSS labelling. Empty string is not the same as "none declared". */
  allergens: text("allergens"),

  /** Legal Metrology Rule 6. Free text, because "200g (2 x 100g)" is valid. */
  netQuantity: text("net_quantity"),
  shelfLife: text("shelf_life"),
  storageInstructions: text("storage_instructions"),

  /** Consumer Protection (E-Commerce) Rules 2020. */
  countryOfOrigin: text("country_of_origin").default("India"),

  /** Legal Metrology Rule 6. */
  manufacturerName: text("manufacturer_name"),
  manufacturerAddress: text("manufacturer_address"),
  consumerCareContact: text("consumer_care_contact"),

  /** FSS Act. Per product, because a co-packed line may carry another licence. */
  fssaiLicenceNumber: text("fssai_licence_number"),

  /** The FSS labelling mark. */
  vegNonVeg: vegNonVegEnum("veg_non_veg"),

  /** Only if lab-verified. Never estimated, never inferred from a similar product. */
  nutritionalInfo: jsonb("nutritional_info"),

  ...timestamps,
});

// --- product_images ---------------------------------------------------------

export const productImages = pgTable(
  "product_images",
  {
    id: primaryId(),

    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    /** Restricted: an image still in use must not vanish from under a page. */
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "restrict" }),

    /**
     * NOT NULL at the database level. The accessibility rule is a constraint,
     * not a convention — an image cannot be attached without a description.
     */
    altText: text("alt_text").notNull(),

    role: productImageRoleEnum("role").notNull().default("pack"),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),

    ...timestamps,
  },
  (table) => [
    index("product_images_product_sort_idx").on(table.productId, table.sortOrder),
    uniqueIndex("product_images_one_primary_idx")
      .on(table.productId)
      .where(sql`${table.isPrimary}`),
    // The same photograph must not be attached to one product twice.
    uniqueIndex("product_images_product_media_key").on(
      table.productId,
      table.mediaId,
    ),
  ],
);

// --- relations --------------------------------------------------------------

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
    relationName: "product_category",
  }),
  type: one(categories, {
    fields: [products.typeId],
    references: [categories.id],
    relationName: "product_type",
  }),
  variants: many(productVariants),
  images: many(productImages),
  details: one(productDetails, {
    fields: [products.id],
    references: [productDetails.productId],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  media: one(media, {
    fields: [productImages.mediaId],
    references: [media.id],
  }),
}));

export const productDetailsRelations = relations(productDetails, ({ one }) => ({
  product: one(products, {
    fields: [productDetails.productId],
    references: [products.id],
  }),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type ProductDetail = typeof productDetails.$inferSelect;
export type ProductImage = typeof productImages.$inferSelect;
