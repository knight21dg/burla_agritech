ALTER TYPE "public"."variant_status" ADD VALUE 'removed';--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "homepage" jsonb;