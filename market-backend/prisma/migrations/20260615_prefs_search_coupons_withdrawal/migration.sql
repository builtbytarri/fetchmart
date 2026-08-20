-- Notification preferences on users
ALTER TABLE "users" ADD COLUMN "notify_push" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "notify_order_updates" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "notify_promotions" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "notify_new_stores" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "notify_email" BOOLEAN NOT NULL DEFAULT true;

-- Withdrawal settings on platform_settings
ALTER TABLE "platform_settings" ADD COLUMN "withdrawal_min_amount" DECIMAL(10,2) NOT NULL DEFAULT 1000;
ALTER TABLE "platform_settings" ADD COLUMN "withdrawal_fee_percent" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Coupon discount on orders
ALTER TABLE "orders" ADD COLUMN "coupon_code" TEXT;
ALTER TABLE "orders" ADD COLUMN "discount_amount" DECIMAL(10,2);

-- Coupons table
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" "DiscountType" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "min_order_amount" DECIMAL(10,2),
    "max_discount" DECIMAL(10,2),
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");
