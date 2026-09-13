-- A second workout is a separate calendar item, never an implicit extension of the first.
-- The slot keeps calendar and watch delivery deterministic while preserving existing plans.
ALTER TABLE public.user_workouts
  ADD COLUMN IF NOT EXISTS scheduled_slot TEXT NOT NULL DEFAULT 'flexible'
  CHECK (scheduled_slot IN ('morning', 'evening', 'flexible'));

CREATE INDEX IF NOT EXISTS idx_user_workouts_schedule_slot
  ON public.user_workouts (user_id, scheduled_date, scheduled_slot);
