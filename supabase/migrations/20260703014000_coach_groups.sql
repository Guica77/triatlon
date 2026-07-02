-- Migration: Coach Groups

-- 1. Create coach_groups table
CREATE TABLE IF NOT EXISTS public.coach_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT 'bg-zinc-100 text-zinc-800',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add group_id to coach_athletes
ALTER TABLE public.coach_athletes 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.coach_groups(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.coach_groups ENABLE ROW LEVEL SECURITY;

-- 4. Policies for coach_groups
CREATE POLICY "Coaches can view their own groups" ON public.coach_groups
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can insert their own groups" ON public.coach_groups
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update their own groups" ON public.coach_groups
    FOR UPDATE USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete their own groups" ON public.coach_groups
    FOR DELETE USING (auth.uid() = coach_id);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_coach_groups_coach ON public.coach_groups(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_athletes_group ON public.coach_athletes(group_id);
