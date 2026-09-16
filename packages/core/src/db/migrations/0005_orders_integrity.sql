-- Hand-written. The order rules a column definition cannot express.
-- docs/ORDERS.md.


-- ---------------------------------------------------------------------------
-- 1. updated_at on orders, by the same trigger as every other table
-- ---------------------------------------------------------------------------

CREATE TRIGGER orders_set_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 2. Order history is append-only
--
-- The timeline a customer sees, and the answer to "who cancelled this?".
-- A history that can be edited answers neither.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION order_events_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'order_events is append-only.'
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER order_events_append_only_trigger
  BEFORE UPDATE OR DELETE ON order_events
  FOR EACH ROW EXECUTE FUNCTION order_events_append_only();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 3. An order's lines are fixed once written
--
-- The price, name and quantity agreed at checkout are the record. The only
-- change allowed is the catalogue link being cleared (ON DELETE SET NULL)
-- when a product is removed — the snapshot columns never move.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION order_items_fixed() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'order_items cannot be deleted.'
      USING ERRCODE = 'restrict_violation';
  END IF;

  IF (NEW.order_id, NEW.product_name, NEW.product_slug, NEW.variant_label,
      NEW.sku, NEW.unit_price_minor, NEW.quantity, NEW.line_total_minor)
     IS DISTINCT FROM
     (OLD.order_id, OLD.product_name, OLD.product_slug, OLD.variant_label,
      OLD.sku, OLD.unit_price_minor, OLD.quantity, OLD.line_total_minor)
  THEN
    RAISE EXCEPTION 'order_items are fixed once the order is placed.'
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER order_items_fixed_trigger
  BEFORE UPDATE OR DELETE ON order_items
  FOR EACH ROW EXECUTE FUNCTION order_items_fixed();
