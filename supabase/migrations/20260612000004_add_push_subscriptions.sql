-- Add push_subscriptions column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_subscriptions JSONB;
