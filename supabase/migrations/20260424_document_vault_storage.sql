-- ============================================================================
-- Document Vault Storage Bucket & Organization-Scoped RLS
-- ============================================================================
-- Private bucket for uploaded files, attachments, and scanned legal documents.
-- Access is strictly gated by organization membership: org_id/client_id/filename.ext

-- 1. Create the private bucket for vault documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('vault_documents', 'vault_documents', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if any to prevent conflicts on re-runs
DROP POLICY IF EXISTS "Org members can view vault documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload vault documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can update vault documents" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete vault documents" ON storage.objects;

-- 3. Policy: SELECT (Read access) - Only members of the owning organization
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

-- 4. Policy: INSERT (Upload access) - Only members of the owning organization
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

-- 5. Policy: UPDATE (Edit/overwrite access) - Only members of the owning organization
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

-- 6. Policy: DELETE (Deletion access) - Only members of the owning organization
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
