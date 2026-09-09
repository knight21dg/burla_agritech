-- Hand-written. Rules that cannot be expressed as a Drizzle column or a plain
-- CHECK constraint, because Postgres CHECK constraints may not contain a
-- subquery. Each one is asserted by an integration test — do not remove a
-- trigger because "the service already checks it". The service is one caller.
--
-- docs/DATABASE-DESIGN.md §3, §4, §9.


-- ---------------------------------------------------------------------------
-- 1. updated_at
--
-- Maintained by the database, not by application code. An ORM that forgets to
-- set this column is the normal way it starts lying.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'media', 'categories', 'products', 'product_variants', 'product_details',
    'product_images', 'users', 'password_credentials', 'sessions', 'roles',
    'verification_tokens', 'addresses', 'enquiries', 'site_settings',
    'locations', 'redirects'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t || '_set_updated_at', t
    );
  END LOOP;
END;
$$;
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 2. Taxonomy depth
--
-- Exactly two levels. A type cannot have a type.
--
-- Checked on the way in (a row may not point at a parent that already has a
-- parent) and on the way out (a row that already has children may not be given
-- a parent, which would make its children grandchildren).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION categories_enforce_depth() RETURNS trigger AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM categories p
    WHERE p.id = NEW.parent_id AND p.parent_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION
      'Category "%" cannot sit under a type. The taxonomy is two levels: category then type.',
      NEW.slug
      USING ERRCODE = 'check_violation';
  END IF;

  IF EXISTS (SELECT 1 FROM categories c WHERE c.parent_id = NEW.id) THEN
    RAISE EXCEPTION
      'Category "%" has types of its own and cannot itself become a type.',
      NEW.slug
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER categories_enforce_depth_trigger
  BEFORE INSERT OR UPDATE OF parent_id ON categories
  FOR EACH ROW EXECUTE FUNCTION categories_enforce_depth();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 3. Product category / type consistency
--
-- `products.category_id` is always the TOP-LEVEL category, and `type_id`, when
-- set, is always one of that category's children.
--
-- The denormalisation is deliberate — breadcrumbs and listings need the
-- top-level category on every render, and walking the parent chain per row
-- would be a recursive query per product. This trigger is what keeps the
-- denormalised pair honest. DATABASE-DESIGN.md §4.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION products_enforce_taxonomy() RETURNS trigger AS $$
DECLARE
  category_parent uuid;
  type_parent uuid;
  type_exists boolean;
BEGIN
  SELECT c.parent_id INTO category_parent
  FROM categories c WHERE c.id = NEW.category_id;

  IF category_parent IS NOT NULL THEN
    RAISE EXCEPTION
      'products.category_id must be a top-level category, but % is a type.',
      NEW.category_id
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.type_id IS NOT NULL THEN
    SELECT true, c.parent_id INTO type_exists, type_parent
    FROM categories c WHERE c.id = NEW.type_id;

    IF type_parent IS DISTINCT FROM NEW.category_id THEN
      RAISE EXCEPTION
        'products.type_id % is not a type of category %.',
        NEW.type_id, NEW.category_id
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER products_enforce_taxonomy_trigger
  BEFORE INSERT OR UPDATE OF category_id, type_id ON products
  FOR EACH ROW EXECUTE FUNCTION products_enforce_taxonomy();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 4. Stock is a running total, never set blind
--
-- Every inventory_movements row applies its delta to the variant. The service
-- writes the movement; it does not write stock_quantity. The CHECK constraint
-- (stock_quantity >= 0) then makes overselling a database error rather than a
-- race the application has to win.
--
-- Callers take SELECT ... FOR UPDATE on the variant first, so two customers
-- buying the last unit serialise: one succeeds, one fails cleanly.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION inventory_apply_movement() RETURNS trigger AS $$
BEGIN
  UPDATE product_variants
     SET stock_quantity = stock_quantity + NEW.delta
   WHERE id = NEW.variant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Variant % does not exist.', NEW.variant_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER inventory_apply_movement_trigger
  AFTER INSERT ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION inventory_apply_movement();
--> statement-breakpoint

-- Movements are an append-only ledger. Rewriting history would leave
-- stock_quantity unexplainable, which defeats the point of having a ledger.
CREATE OR REPLACE FUNCTION inventory_movements_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION
    'inventory_movements is append-only. Record a correcting movement instead.'
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER inventory_movements_append_only_trigger
  BEFORE UPDATE OR DELETE ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION inventory_movements_append_only();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 5. The audit log is append-only, for the same reason
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION audit_log_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only.'
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE TRIGGER audit_log_append_only_trigger
  BEFORE UPDATE OR DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 6. Trigram index for the fuzzy search fallback
--
-- Postgres full-text handles "mango pickle". It does not handle "vadiyaalu"
-- for "vadiyalu", because the two stem differently. Similarity search does.
-- ---------------------------------------------------------------------------

CREATE INDEX products_name_trgm_idx ON products USING gin (name gin_trgm_ops);
--> statement-breakpoint


-- ---------------------------------------------------------------------------
-- 7. Roles
--
-- Reference data, not sample data: the permission model in
-- docs/AUTHORIZATION.md §2 depends on these five keys existing. Inserted here
-- rather than in the seed so that they are present in every environment,
-- including production, before anyone can be granted one.
-- ---------------------------------------------------------------------------

INSERT INTO roles (key, name, description) VALUES
  ('customer',        'Customer',        'Owns their own account, orders and addresses.'),
  ('staff',           'Staff',           'Reads and answers enquiries, adjusts stock.'),
  ('content_manager', 'Content manager', 'Publishes products and page content. No access to orders or customer data.'),
  ('order_manager',   'Order manager',   'Sees and fulfils orders. Cannot change prices.'),
  ('admin',           'Administrator',   'Everything, including users, roles and legal settings.')
ON CONFLICT (key) DO NOTHING;
