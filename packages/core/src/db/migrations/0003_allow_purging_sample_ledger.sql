-- One narrow exception to the append-only inventory ledger.
--
-- The problem this fixes was found by actually running the purge, not by
-- reading the schema: `inventory_movements.variant_id` is ON DELETE RESTRICT
-- *and* the table refuses DELETE outright. Both are right on their own. Taken
-- together they made demonstration data impossible to remove — so the boot
-- guard was telling a production operator to run a command that could only
-- fail. A guard whose remediation does not work is worse than no guard.
--
-- The append-only rule exists to protect the BUSINESS ledger: stock_quantity
-- is its running total, and rewriting history would make the number
-- unexplainable. Rows belonging to a product flagged `is_sample` are not
-- business records. They are scaffolding we invented, and removing them is the
-- entire point of the purge.
--
-- So: DELETE is permitted only when the movement belongs to a sample product.
-- UPDATE is still refused for every row without exception — correcting a
-- quantity means recording a correcting movement, always.

CREATE OR REPLACE FUNCTION inventory_movements_append_only() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND EXISTS (
    SELECT 1
      FROM product_variants v
      JOIN products p ON p.id = v.product_id
     WHERE v.id = OLD.variant_id
       AND p.is_sample
  ) THEN
    RETURN OLD;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION
      'inventory_movements is append-only. Record a correcting movement instead.'
      USING ERRCODE = 'restrict_violation';
  END IF;

  RAISE EXCEPTION
    'inventory_movements cannot be edited. Record a correcting movement instead.'
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;
