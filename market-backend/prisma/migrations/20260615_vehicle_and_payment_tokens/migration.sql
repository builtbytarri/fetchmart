-- Add vehicle info columns to riders table
ALTER TABLE "riders" ADD COLUMN "vehicle_type"  TEXT;
ALTER TABLE "riders" ADD COLUMN "vehicle_plate" TEXT;
ALTER TABLE "riders" ADD COLUMN "vehicle_color" TEXT;

-- Create payment_tokens table for saved Flutterwave card tokens
CREATE TABLE "payment_tokens" (
    "id"           TEXT NOT NULL,
    "user_id"      TEXT NOT NULL,
    "token"        TEXT NOT NULL,
    "masked_card"  TEXT NOT NULL,
    "card_type"    TEXT NOT NULL,
    "expiry_month" TEXT NOT NULL,
    "expiry_year"  TEXT NOT NULL,
    "is_default"   BOOLEAN NOT NULL DEFAULT false,
    "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_tokens_user_id_idx" ON "payment_tokens"("user_id");

ALTER TABLE "payment_tokens"
    ADD CONSTRAINT "payment_tokens_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
