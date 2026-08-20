-- Unit-based selling (mudu, kg…) with fractional quantities, and an
-- "In Stock" mode for goods that cannot practically be counted.
--
-- Two independent customer requests, done in one migration because they touch
-- the same table and the same product form.

CREATE TYPE "ProductUnit" AS ENUM ('PIECE', 'KG', 'MUDU', 'BAG', 'LITRE', 'PACK');
CREATE TYPE "StockMode"  AS ENUM ('COUNTED', 'IN_STOCK');

-- ── Products ────────────────────────────────────────────────────────────────
ALTER TABLE "products"
  ADD COLUMN "unit"       "ProductUnit" NOT NULL DEFAULT 'PIECE',
  ADD COLUMN "step_size"  DECIMAL(6,3)  NOT NULL DEFAULT 1,
  ADD COLUMN "stock_mode" "StockMode"   NOT NULL DEFAULT 'COUNTED';

-- Widen stock so a store can hold 12.5 kg. Integer -> numeric is a widening
-- cast, so every existing value survives untouched.
ALTER TABLE "products"
  ALTER COLUMN "stock_quantity" TYPE DECIMAL(10,3),
  ALTER COLUMN "stock_quantity" SET DEFAULT 0;

-- ── Order items ─────────────────────────────────────────────────────────────
-- Existing rows are whole numbers; the cast preserves them exactly.
ALTER TABLE "order_items"
  ALTER COLUMN "quantity" TYPE DECIMAL(10,3);

ALTER TABLE "order_items"
  ADD COLUMN "unit" "ProductUnit" NOT NULL DEFAULT 'PIECE';

-- Backfill the historical snapshot from the product's current unit. Every
-- product is PIECE at this point, so this is a no-op today — it exists so the
-- column is correct if this migration is ever replayed against seeded data.
UPDATE "order_items" oi
SET "unit" = p."unit"
FROM "products" p
WHERE p."id" = oi."product_id";
