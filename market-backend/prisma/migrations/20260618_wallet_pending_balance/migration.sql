-- Split wallet funds into withdrawable (balance) and provisional (pending_balance).
--
-- Stores are credited at PAID, before the order is fulfilled, so that money must
-- not be withdrawable until the order completes. Without this split a store could
-- withdraw a payout and then decline the order, driving the wallet negative and
-- leaving the platform to fund the customer refund out of its own pocket.

ALTER TABLE "wallets"
  ADD COLUMN "pending_balance" DECIMAL(12,2) NOT NULL DEFAULT 0;

ALTER TABLE "orders"
  ADD COLUMN "store_settled" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: any order already credited to a store and not reversed represents
-- money currently sitting in `balance`.
--
--  * COMPLETED  -> genuinely earned. Leave in balance, mark as settled so the
--                  new promotion step never double-counts it.
--  * otherwise  -> still provisional. Move it out of the withdrawable balance
--                  into pending_balance.
--
-- Cancelled/refunded orders are excluded: their credits were already reversed
-- (store_reversed = true), so there is nothing left in the wallet for them.

UPDATE "orders"
SET "store_settled" = true
WHERE "store_credited" = true
  AND "store_reversed" = false
  AND "status" = 'COMPLETED';

WITH provisional AS (
  SELECT o."store_id" AS store_id,
         SUM(o."store_payout") AS amount
  FROM "orders" o
  WHERE o."store_credited" = true
    AND o."store_reversed" = false
    AND o."store_settled"  = false
    AND o."store_payout" IS NOT NULL
  GROUP BY o."store_id"
)
UPDATE "wallets" w
SET "balance"         = GREATEST(w."balance" - p.amount, 0),
    "pending_balance" = w."pending_balance" + LEAST(p.amount, w."balance")
FROM provisional p
WHERE w."store_id" = p.store_id;
