-- Migration: Add max_hr to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_hr numeric;
