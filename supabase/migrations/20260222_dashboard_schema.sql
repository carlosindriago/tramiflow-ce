-- ============================================================================
-- Dashboard Schema Updates (20260222)
-- ============================================================================
-- 1. Add missing columns to organizations (whatsapp)
-- 2. Ensure slug exists and is indexed
-- 3. Create procedures table for real dashboard data

-- 1. Organizations Updates
DO $$
BEGIN
    -- Add whatsapp column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'whatsapp') THEN
        ALTER TABLE public.organizations ADD COLUMN whatsapp TEXT;
    END IF;

    -- Ensure slug exists (should be there from 20260220)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'slug') THEN
        ALTER TABLE public.organizations ADD COLUMN slug TEXT UNIQUE; -- logic to populate?
        -- Note: If empty, uniq constraint might fail on multiple nulls if not careful, but PG allows multiple NULLs in UNIQUE.
    END IF;
    
    -- Ensure slug index exists (UNIQUE constraint creates it, but explicit index is good for text search)
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'organizations' AND indexname = 'idx_organizations_slug') THEN
        CREATE INDEX idx_organizations_slug ON public.organizations(slug);
    END IF;
END $$;

-- 2. Create Procedures Table
CREATE TABLE IF NOT EXISTS public.procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.procedure_templates(id),
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    expiration_date TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns/constraints if table already existed (idempotent)
DO $$
BEGIN
    -- Ensure columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'template_id') THEN
        ALTER TABLE public.procedures ADD COLUMN template_id UUID REFERENCES public.procedure_templates(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'expiration_date') THEN
        ALTER TABLE public.procedures ADD COLUMN expiration_date TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'metadata') THEN
        ALTER TABLE public.procedures ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'procedures' AND indexname = 'idx_procedures_org_id') THEN
        CREATE INDEX idx_procedures_org_id ON public.procedures(organization_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'procedures' AND indexname = 'idx_procedures_client_id') THEN
        CREATE INDEX idx_procedures_client_id ON public.procedures(client_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'procedures' AND indexname = 'idx_procedures_status') THEN
        CREATE INDEX idx_procedures_status ON public.procedures(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'procedures' AND indexname = 'idx_procedures_expiration') THEN
        CREATE INDEX idx_procedures_expiration ON public.procedures(expiration_date);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'procedures' AND indexname = 'idx_procedures_updated_at') THEN
        CREATE INDEX idx_procedures_updated_at ON public.procedures(updated_at DESC);
    END IF;
END $$;

-- 3. RLS for Procedures
ALTER TABLE public.procedures ENABLE ROW LEVEL SECURITY;

-- Policy: Org members can view procedures
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'procedures' AND policyname = 'Org members can view procedures') THEN
        CREATE POLICY "Org members can view procedures" ON public.procedures
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT user_id FROM public.organization_members WHERE organization_id = procedures.organization_id
                )
            );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'procedures' AND policyname = 'Org members can insert procedures') THEN
        CREATE POLICY "Org members can insert procedures" ON public.procedures
            FOR INSERT WITH CHECK (
                auth.uid() IN (
                    SELECT user_id FROM public.organization_members WHERE organization_id = procedures.organization_id
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'procedures' AND policyname = 'Org members can update procedures') THEN
        CREATE POLICY "Org members can update procedures" ON public.procedures
            FOR UPDATE USING (
                auth.uid() IN (
                    SELECT user_id FROM public.organization_members WHERE organization_id = procedures.organization_id
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'procedures' AND policyname = 'Org members can delete procedures') THEN
         CREATE POLICY "Org members can delete procedures" ON public.procedures
            FOR DELETE USING (
                auth.uid() IN (
                    SELECT user_id FROM public.organization_members WHERE organization_id = procedures.organization_id
                )
            );
    END IF;
END $$;
