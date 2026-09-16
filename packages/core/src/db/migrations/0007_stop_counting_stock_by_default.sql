-- Stop counting stock for pack sizes, by default.
--
-- The admin gives the owner one switch per pack: "Available — Yes / No".
-- With stock counted underneath it, every order quietly subtracted from a
-- number the owner never sees and has no screen to restore, and a pack would
-- eventually turn "Out of stock" on the site with nothing in the admin to
-- explain or fix it.
--
-- So stock is not counted unless someone deliberately turns counting back on
-- for a pack. Nothing is lost: `stock_quantity` keeps its value and the ledger
-- in `inventory_movements` keeps every movement, so counting can be resumed
-- from the true figure if inventory management is ever wanted.
--
-- A pack that was out of stock is made unavailable rather than silently put
-- back on sale — the owner decides when it returns.
UPDATE "product_variants"
   SET "status" = 'inactive'
 WHERE "track_inventory" = true
   AND "stock_quantity" <= 0
   AND "status" = 'active';
--> statement-breakpoint
UPDATE "product_variants"
   SET "track_inventory" = false
 WHERE "track_inventory" = true;
--> statement-breakpoint
ALTER TABLE "product_variants" ALTER COLUMN "track_inventory" SET DEFAULT false;
