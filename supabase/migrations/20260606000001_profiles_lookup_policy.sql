-- SQL Migration: Profiles Lookup Policy for Coach Roster
-- This policy allows authenticated users (such as coaches) to search/read profiles of registered athletes by email in order to link them to their roster.

CREATE POLICY "Allow select for athlete lookup" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (role = 'athlete');
