-- AddColumn: rider_declines on orders
ALTER TABLE "orders" ADD COLUMN "rider_declines" JSONB NOT NULL DEFAULT '[]';
