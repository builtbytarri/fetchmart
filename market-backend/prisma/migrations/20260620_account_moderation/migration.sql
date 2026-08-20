-- Suspension / soft deletion for stores and riders.
--
-- Riders previously had no status field of any kind, so a defaulting rider
-- could not be stopped at all. Stores only had `is_verified`, which conflates
-- "never approved" with "banned".
--
-- Deletion is soft: orders, ledger entries and withdrawals reference both
-- tables, so removing rows would destroy financial history.

CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

ALTER TABLE "stores"
  ADD COLUMN "status"           "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "suspended_reason" TEXT,
  ADD COLUMN "suspended_at"     TIMESTAMP(3),
  ADD COLUMN "deleted_at"       TIMESTAMP(3);

ALTER TABLE "riders"
  ADD COLUMN "status"           "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "suspended_reason" TEXT,
  ADD COLUMN "suspended_at"     TIMESTAMP(3),
  ADD COLUMN "deleted_at"       TIMESTAMP(3);

-- Partial indexes: every customer-facing query filters on "active and not
-- deleted", which is the overwhelming majority of rows.
CREATE INDEX "stores_active_idx" ON "stores" ("status") WHERE "deleted_at" IS NULL;
CREATE INDEX "riders_active_idx" ON "riders" ("status") WHERE "deleted_at" IS NULL;
