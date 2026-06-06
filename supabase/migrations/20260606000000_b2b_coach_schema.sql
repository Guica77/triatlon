-- SQL Migration: B2B Coach and Athlete Infrastructure

-- 1. Extend profiles table with role and email columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'athlete' CHECK (role IN ('athlete', 'coach'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Create coach_athletes table to relate coaches and athletes
CREATE TABLE IF NOT EXISTS public.coach_athletes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    athlete_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(coach_id, athlete_id)
);

-- 3. Create chat_messages table for messaging
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.coach_athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Policies for coach_athletes
CREATE POLICY "Coaches can view their own entries" ON public.coach_athletes
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Athletes can view their own entries" ON public.coach_athletes
    FOR SELECT USING (auth.uid() = athlete_id);

CREATE POLICY "Coaches can insert connections" ON public.coach_athletes
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete connections" ON public.coach_athletes
    FOR DELETE USING (auth.uid() = coach_id);

-- 5. Policies for chat_messages
CREATE POLICY "Users can read their own chat messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert their own chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- 6. Grant select access for coaches to athletes' data
CREATE POLICY "Coaches can view their athletes' profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_athletes 
            WHERE coach_id = auth.uid() AND athlete_id = profiles.id
        )
    );

CREATE POLICY "Coaches can view their athletes' biometrics" ON public.user_biometrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_athletes 
            WHERE coach_id = auth.uid() AND athlete_id = user_biometrics.user_id
        )
    );

CREATE POLICY "Coaches can view their athletes' workouts" ON public.user_workouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.coach_athletes 
            WHERE coach_id = auth.uid() AND athlete_id = user_workouts.user_id
        )
    );

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coach_athletes_coach ON public.coach_athletes(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_athletes_athlete ON public.coach_athletes(athlete_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_receiver ON public.chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
