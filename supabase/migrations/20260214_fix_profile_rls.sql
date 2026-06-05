-- Fix RLS policy for profiles
-- Allow users to view their own profile regardless of organization_id

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view org profiles" ON public.profiles;

-- Recreate with simpler logic
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can view org profiles"
ON public.profiles FOR SELECT
USING (
    id = auth.uid() OR
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);
