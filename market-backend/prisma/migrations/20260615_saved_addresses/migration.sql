-- CreateTable
CREATE TABLE "saved_addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "saved_addresses_user_id_idx" ON "saved_addresses"("user_id");

-- AddForeignKey
ALTER TABLE "saved_addresses" ADD CONSTRAINT "saved_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing profile addresses into saved_addresses
INSERT INTO "saved_addresses" ("id", "user_id", "label", "address", "latitude", "longitude", "is_default", "created_at", "updated_at")
SELECT
    gen_random_uuid()::text,
    "id",
    'Home',
    "address",
    "latitude",
    "longitude",
    true,
    NOW(),
    NOW()
FROM "users"
WHERE "address" IS NOT NULL
  AND "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL;
