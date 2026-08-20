-- Order reversal idempotency guards
ALTER TABLE "orders" ADD COLUMN "store_reversed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "orders" ADD COLUMN "rider_reversed" BOOLEAN NOT NULL DEFAULT false;

-- Store acceptance timeout (minutes) on platform settings
ALTER TABLE "platform_settings" ADD COLUMN "store_accept_timeout_minutes" INTEGER NOT NULL DEFAULT 10;

-- Settlement enums
CREATE TYPE "SettlementType" AS ENUM ('STORE_DECLINE', 'STORE_TIMEOUT', 'ADMIN_CANCEL', 'ADMIN_SETTLE');
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
CREATE TYPE "FaultParty" AS ENUM ('STORE', 'RIDER', 'CUSTOMER', 'PLATFORM');

-- Settlements audit table
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "type" "SettlementType" NOT NULL,
    "reason" TEXT,
    "refund_amount" DECIMAL(10,2) NOT NULL,
    "store_reversal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rider_reversal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rider_compensation" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fault_party" "FaultParty",
    "refund_status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "settlements_order_id_idx" ON "settlements"("order_id");

ALTER TABLE "settlements" ADD CONSTRAINT "settlements_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
