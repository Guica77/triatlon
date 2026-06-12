-- Migration: add_invite_code_to_profiles
ALTER TABLE "public"."profiles"
ADD COLUMN IF NOT EXISTS "invite_code" text;

CREATE UNIQUE INDEX IF NOT EXISTS "profiles_invite_code_idx" ON "public"."profiles" ("invite_code");
