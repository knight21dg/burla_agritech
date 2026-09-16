-- Adds two columns the catalogue needs before it can be seeded.
--
-- `tone` is the card tint and placeholder treatment. It has to be in the
-- database, not derived, because it is an editorial choice per row -- and
-- because the Phase 8 cutover has to render byte-identical output.
--
-- `is_sample` marks rows created by the demonstration seed. The ten top-level
-- categories are client-derived and are NOT sample data; the type layer and
-- all 28 products are invented by us and must never reach production.
--
-- Safe on a populated table: since PostgreSQL 11, ADD COLUMN with a constant
-- DEFAULT stores the default in the catalogue rather than rewriting every row,
-- so there is no long exclusive lock. MIGRATIONS.md section 5 still applies to
-- any non-constant default.

CREATE TYPE "public"."tone" AS ENUM('turmeric', 'mango', 'chilli', 'leaf', 'grain', 'berry', 'earth', 'cream');--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "tone" "tone" DEFAULT 'cream' NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_sample" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tone" "tone" DEFAULT 'cream' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_sample" boolean DEFAULT false NOT NULL;