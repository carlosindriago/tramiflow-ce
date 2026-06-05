-- =============================================================================
-- SMART DOCUMENTS: Storage bucket + documents table refactor
-- =============================================================================

-- 0. Create clients table if missing (Dependency for documents)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    document_number TEXT,
    nationality TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON public.clients(organization_id);

-- 0.5 Create documents table if missing
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    procedure_id UUID,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL DEFAULT '',
    size BIGINT DEFAULT 0,
    category TEXT,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'client-docs',
    'client-docs',
    false,
    3145728, -- 3MB in bytes
    ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Refactor documents table: remove Google Drive columns, add Storage columns
ALTER TABLE public.documents
    DROP COLUMN IF EXISTS google_file_id,
    DROP COLUMN IF EXISTS webview_link;

DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'storage_path') THEN
        ALTER TABLE public.documents ADD COLUMN storage_path TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'url') THEN
        ALTER TABLE public.documents ADD COLUMN url TEXT NOT NULL DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'size') THEN
        ALTER TABLE public.documents ADD COLUMN size BIGINT DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'category') THEN
        ALTER TABLE public.documents ADD COLUMN category TEXT DEFAULT 'otros';
    END IF;
    
    -- Add category constraint safely
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'documents_category_check') THEN
        ALTER TABLE public.documents ADD CONSTRAINT documents_category_check CHECK (category IN ('dni', 'pasaporte', 'pago', 'otros'));
    END IF;
END $$;

-- Remove defaults after migration (they were just for the ALTER)
ALTER TABLE public.documents ALTER COLUMN storage_path DROP DEFAULT;
ALTER TABLE public.documents ALTER COLUMN url DROP DEFAULT;

-- 3. Add indexes
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON public.documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);

-- 4. RLS policies for documents table
DROP POLICY IF EXISTS "Users can view own org documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert own org documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete own org documents" ON public.documents;
DROP POLICY IF EXISTS "Service role bypass" ON public.documents;

CREATE POLICY "Users can view own org documents"
ON public.documents FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert own org documents"
ON public.documents FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete own org documents"
ON public.documents FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- 5. Storage RLS policies for client-docs bucket
CREATE POLICY "Org members can upload client docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'client-docs'
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Org members can read client docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'client-docs'
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Org members can delete client docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'client-docs'
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
);
