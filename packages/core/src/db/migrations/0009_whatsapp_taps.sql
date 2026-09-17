CREATE TABLE "whatsapp_taps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"place" text NOT NULL,
	"page_path" text NOT NULL,
	"product_id" uuid,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_taps_place_check" CHECK ("whatsapp_taps"."place" in ('floating', 'footer', 'contact', 'wholesale', 'search', 'page')),
	CONSTRAINT "whatsapp_taps_path_check" CHECK (left("whatsapp_taps"."page_path", 1) = '/' and length("whatsapp_taps"."page_path") <= 200)
);
--> statement-breakpoint
ALTER TABLE "whatsapp_taps" ADD CONSTRAINT "whatsapp_taps_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_taps_created_idx" ON "whatsapp_taps" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE TRIGGER whatsapp_taps_set_updated_at BEFORE UPDATE ON whatsapp_taps
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
