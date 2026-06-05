-- =============================================================================
-- FIX: Storage RLS & Template Schema
-- =============================================================================

-- 1. Fix Procedure Templates Schema (Missing columns for Fees)
-- Ensure 'fees' and 'government_fee' exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedure_templates' AND column_name = 'fees') THEN
        ALTER TABLE public.procedure_templates ADD COLUMN fees DECIMAL(10, 2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedure_templates' AND column_name = 'government_fee') THEN
        ALTER TABLE public.procedure_templates ADD COLUMN government_fee DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Also ensure 'payment_terms' exists just in case
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedure_templates' AND column_name = 'payment_terms') THEN
        ALTER TABLE public.procedure_templates ADD COLUMN payment_terms TEXT DEFAULT 'upfront';
    END IF;
END $$;

-- 2. Fix Storage RLS for 'client-docs' bucket
-- The previous policies relied on public.profiles.organization_id which might be null or not reflect all memberships.
-- We should check public.organization_members instead.

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Org members can upload client docs" ON storage.objects;
DROP POLICY IF EXISTS "Org members can read client docs" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete client docs" ON storage.objects;

-- Create new robust policies
-- Helper logic: (storage.foldername(name))[1] is the organization_id from the path "orgId/clientId/file"

CREATE POLICY "Org members can upload client docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'client-docs'
    AND (
        -- Check if user is a member of the organization extracted from the path
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.user_id = auth.uid()
            AND organization_members.organization_id::text = (storage.foldername(name))[1]
        )
    )
);

CREATE POLICY "Org members can read client docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'client-docs'
    AND (
        -- Check if user is a member of the organization extracted from the path
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.user_id = auth.uid()
            AND organization_members.organization_id::text = (storage.foldername(name))[1]
        )
    )
);

CREATE POLICY "Org members can delete client docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'client-docs'
    AND (
        -- Check if user is a member of the organization extracted from the path
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_members.user_id = auth.uid()
            AND organization_members.organization_id::text = (storage.foldername(name))[1]
        )
    )
);
