-- CreateEnum
CREATE TYPE "WalletOwnerType" AS ENUM ('STORE', 'RIDER');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT', 'FEE');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "is_bulky" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "subtotal" DECIMAL(10,2),
ADD COLUMN     "service_fee" DECIMAL(10,2),
ADD COLUMN     "delivery_fee" DECIMAL(10,2),
ADD COLUMN     "commission_amount" DECIMAL(10,2),
ADD COLUMN     "store_payout" DECIMAL(10,2),
ADD COLUMN     "rider_payout" DECIMAL(10,2),
ADD COLUMN     "admin_profit" DECIMAL(10,2),
ADD COLUMN     "distance_km" DECIMAL(8,3),
ADD COLUMN     "store_credited" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rider_credited" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "commission_percent" DECIMAL(5,2) NOT NULL DEFAULT 8,
    "service_fee_percent" DECIMAL(5,2) NOT NULL DEFAULT 6,
    "delivery_base_fee" DECIMAL(10,2) NOT NULL DEFAULT 1300,
    "free_radius_km" DECIMAL(6,2) NOT NULL DEFAULT 3,
    "per_km_rate" DECIMAL(10,2) NOT NULL DEFAULT 250,
    "extra_stop_fee" DECIMAL(10,2) NOT NULL DEFAULT 350,
    "bulky_item_fee" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "night_surcharge" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "night_start_hour" INTEGER NOT NULL DEFAULT 20,
    "night_end_hour" INTEGER NOT NULL DEFAULT 6,
    "rider_delivery_share_percent" DECIMAL(5,2) NOT NULL DEFAULT 80,
    "store_pool_subaccount_id" TEXT,
    "rider_pool_subaccount_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "owner_type" "WalletOwnerType" NOT NULL,
    "store_id" TEXT,
    "rider_id" TEXT,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "order_id" TEXT,
    "type" "LedgerEntryType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_code" TEXT NOT NULL,
    "bank_name" TEXT,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT NOT NULL,
    "flw_transfer_id" TEXT,
    "bank_code" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "failure_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_store_id_key" ON "wallets"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_rider_id_key" ON "wallets"("rider_id");

-- CreateIndex
CREATE INDEX "ledger_entries_wallet_id_idx" ON "ledger_entries"("wallet_id");

-- CreateIndex
CREATE INDEX "ledger_entries_order_id_idx" ON "ledger_entries"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_user_id_key" ON "bank_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawals_reference_key" ON "withdrawals"("reference");

-- CreateIndex
CREATE INDEX "withdrawals_wallet_id_idx" ON "withdrawals"("wallet_id");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_rider_id_fkey" FOREIGN KEY ("rider_id") REFERENCES "riders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
