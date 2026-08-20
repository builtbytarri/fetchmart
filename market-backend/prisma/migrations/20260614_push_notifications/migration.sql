-- Add push_token column to users table for Expo push notifications
ALTER TABLE "users" ADD COLUMN "push_token" TEXT;
