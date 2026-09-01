-- Migration: Coach Workout Library

CREATE TABLE IF NOT EXISTS public.coach_workout_library (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sport_type TEXT NOT NULL,
    duration_min INTEGER NOT NULL,
    warmup TEXT,
    main TEXT,
    cooldown TEXT,
    intensity_type TEXT DEFAULT 'z2',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.coach_workout_library ENABLE ROW LEVEL SECURITY;

-- Policies for coach_workout_library
DROP POLICY IF EXISTS "Coaches can view their own library" ON public.coach_workout_library;
CREATE POLICY "Coaches can view their own library" ON public.coach_workout_library
    FOR SELECT USING ((SELECT auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Coaches can insert to their own library" ON public.coach_workout_library;
CREATE POLICY "Coaches can insert to their own library" ON public.coach_workout_library
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Coaches can update their own library" ON public.coach_workout_library;
CREATE POLICY "Coaches can update their own library" ON public.coach_workout_library
    FOR UPDATE USING ((SELECT auth.uid()) = coach_id);

DROP POLICY IF EXISTS "Coaches can delete from their own library" ON public.coach_workout_library;
CREATE POLICY "Coaches can delete from their own library" ON public.coach_workout_library
    FOR DELETE USING ((SELECT auth.uid()) = coach_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coach_library_coach ON public.coach_workout_library(coach_id);
