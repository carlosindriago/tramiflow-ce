-- ============================================================================
-- Migration: Secure Document Vault Storage & Organization-Scoped RLS Policies
-- ============================================================================
-- Private bucket for uploaded files, generated PDFs, attachments and vault docs.
-- Path Convention: {organization_id}/{document_type_or_client_id}/{filename}
-- ============================================================================

-- 1. Create or ensure private bucket for vault documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault_documents', 'vault_documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Drop existing policies to guarantee idempotent re-runs
DROP POLICY IF EXISTS "Org members can view vault documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload vault documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can update vault documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete vault documents" ON storage.objects;

-- 3. Policy: SELECT (Read/Download) - Authenticated members of the organization
CREATE POLICY "Org members can view vault documents"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'vault_documents'
        AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id::text = (storage.foldername(name))[1]
              AND om.user_id = auth.uid()
        )
    );

-- 4. Policy: INSERT (Upload) - Authenticated members of the organization
CREATE POLICY "Org members can upload vault documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'vault_documents'
        AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id::text = (storage.foldername(name))[1]
              AND om.user_id = auth.uid()
        )
    );

-- 5. Policy: UPDATE (Modify/Overwrite) - Authenticated members of the organization
CREATE POLICY "Org members can update vault documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'vault_documents'
        AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id::text = (storage.foldername(name))[1]
              AND om.user_id = auth.uid()
        )
    )
    WITH CHECK (
        bucket_id = 'vault_documents'
        AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id::text = (storage.foldername(name))[1]
              AND om.user_id = auth.uid()
        )
    );

-- 6. Policy: DELETE (Remove) - Authenticated members of the organization
CREATE POLICY "Org members can delete vault documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'vault_documents'
        AND EXISTS (
            SELECT 1 FROM public.organization_members om
            WHERE om.organization_id::text = (storage.foldername(name))[1]
              AND om.user_id = auth.uid()
        )
    );
