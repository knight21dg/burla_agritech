/**
 * Files.
 *
 * `media` is the file; `product_images` (in products.ts) is a use of it. The
 * split means the same photograph can appear on a product and a category
 * without being uploaded twice, and it keeps R2 keys in exactly one place.
 *
 * Binaries never go in Postgres. This table holds the key and the metadata;
 * the object lives in R2.
 */
import { index, integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { primaryId, timestamps } from "./_shared";
import { users } from "./identity";

export const media = pgTable(
  "media",
  {
    id: primaryId(),

    /** The R2 object key. Server-chosen, never the uploaded filename. */
    r2Key: text("r2_key").notNull().unique(),

    /** The original filename, kept only so the admin list is readable. */
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),

    /** Known after the upload is verified; lets pages reserve layout space. */
    width: integer("width"),
    height: integer("height"),

    /** Tiny base64 placeholder for next/image, generated on upload. */
    blurDataUrl: text("blur_data_url"),

    uploadedBy: uuid("uploaded_by").references(() => users.id, {
      onDelete: "set null",
    }),

    ...timestamps,
  },
  (table) => [index("media_created_at_idx").on(table.createdAt)],
);

export type Media = typeof media.$inferSelect;
export type NewMedia = typeof media.$inferInsert;
