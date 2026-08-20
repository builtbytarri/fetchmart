-- Storefront photo. Stores previously had no image field at all, so the
-- customer-facing store cards always fell back to a bundled placeholder.
ALTER TABLE "stores" ADD COLUMN "image_url" TEXT;
