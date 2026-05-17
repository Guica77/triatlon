-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Training Plans (Templates from JSON)
CREATE TABLE public.training_plans (
    id TEXT PRIMARY KEY, -- ej: 'sprint_8sem'
    name TEXT NOT NULL,
    distance TEXT NOT NULL,
    duration_weeks INTEGER NOT NULL,
    level TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Training Sessions (The workouts within a plan)
CREATE TABLE public.training_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plan_id TEXT REFERENCES public.training_plans(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    day_name TEXT NOT NULL, -- Lunes, Martes, etc.
    sport_type TEXT NOT NULL, -- natacion, ciclismo, carrera, brick
    duration_min INTEGER,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Profiles (Extended user data)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    level TEXT,
    goal_distance TEXT,
    active_plan_id TEXT REFERENCES public.training_plans(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. User Workouts (The actual instantiated calendar for an athlete)
CREATE TABLE public.user_workouts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL,
    scheduled_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance (Supabase best practices)
CREATE INDEX idx_training_sessions_plan_id ON public.training_sessions(plan_id);
CREATE INDEX idx_user_workouts_user_id ON public.user_workouts(user_id);
CREATE INDEX idx_user_workouts_scheduled_date ON public.user_workouts(scheduled_date);

-- ROW LEVEL SECURITY (RLS)

-- Training Plans & Sessions are public read-only
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.training_plans FOR SELECT USING (true);

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public sessions are viewable by everyone." 
ON public.training_sessions FOR SELECT USING (true);

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User Workouts
ALTER TABLE public.user_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own workouts" 
ON public.user_workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" 
ON public.user_workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" 
ON public.user_workouts FOR UPDATE USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();

CREATE TRIGGER handle_updated_at_user_workouts
    BEFORE UPDATE ON public.user_workouts
    FOR EACH ROW
    EXECUTE PROCEDURE handle_updated_at();
