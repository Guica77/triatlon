-- Migration to add workout_comments table

CREATE TABLE IF NOT EXISTS public.workout_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_id UUID NOT NULL REFERENCES public.user_workouts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.workout_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their workouts" ON public.workout_comments
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_workouts 
    WHERE id = workout_comments.workout_id 
    AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_workouts.user_id AND coach_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Users can insert comments on their workouts" ON public.workout_comments
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.user_workouts 
    WHERE id = workout_comments.workout_id 
    AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_workouts.user_id AND coach_id = auth.uid()
      )
    )
  )
);
