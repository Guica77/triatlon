-- SQL Migration: RLS Write Policies for Coaches
-- This migration enables coaches to update profiles (like active plan), and insert, update, and delete training sessions and workouts for their athletes.

-- 1. Profiles Table Policies
CREATE POLICY "Coaches can update their athletes' profiles" 
ON public.profiles 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athletes 
        WHERE coach_id = auth.uid() AND athlete_id = profiles.id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.coach_athletes 
        WHERE coach_id = auth.uid() AND athlete_id = profiles.id
    )
);

-- 2. User Workouts Table Policies
CREATE POLICY "Coaches can insert workouts for their athletes" 
ON public.user_workouts 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.coach_athletes 
        WHERE coach_id = auth.uid() AND athlete_id = user_workouts.user_id
    )
);

CREATE POLICY "Coaches can update workouts for their athletes" 
ON public.user_workouts 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athletes 
        WHERE coach_id = auth.uid() AND athlete_id = user_workouts.user_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.coach_athletes 
        WHERE coach_id = auth.uid() AND athlete_id = user_workouts.user_id
    )
);

CREATE POLICY "Coaches can delete workouts for their athletes" 
ON public.user_workouts 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athletes 
        WHERE coach_id = auth.uid() AND athlete_id = user_workouts.user_id
    )
);

-- 3. Training Sessions Table Policies
CREATE POLICY "Authenticated users can insert training sessions" 
ON public.training_sessions 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update training sessions" 
ON public.training_sessions 
FOR UPDATE 
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete training sessions" 
ON public.training_sessions 
FOR DELETE 
USING (auth.uid() IS NOT NULL);
