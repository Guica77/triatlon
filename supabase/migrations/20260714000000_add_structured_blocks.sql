-- Migration: Add structured_blocks to training_sessions

ALTER TABLE public.training_sessions 
ADD COLUMN IF NOT EXISTS structured_blocks JSONB DEFAULT '[]'::jsonb;
