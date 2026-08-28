-- =============================================================================
-- Migration: Document Templates & Generated Documents (20260421)
-- =============================================================================

-- 1. Create document_templates table
CREATE TABLE IF NOT EXISTS public.document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_ast JSONB NOT NULL DEFAULT '{}'::jsonb,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    margins JSONB NOT NULL DEFAULT '{"top": 20, "right": 20, "bottom": 20, "left": 20}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create generated_documents table
CREATE TABLE IF NOT EXISTS public.generated_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.document_templates(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    final_ast JSONB NOT NULL DEFAULT '{}'::jsonb,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_document_templates_org ON public.document_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_org ON public.generated_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_template ON public.generated_documents(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_documents_client ON public.generated_documents(client_id);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_templates
CREATE POLICY "Users can view own org document_templates"
ON public.document_templates FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert own org document_templates"
ON public.document_templates FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own org document_templates"
ON public.document_templates FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete own org document_templates"
ON public.document_templates FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- RLS Policies for generated_documents
CREATE POLICY "Users can view own org generated_documents"
ON public.generated_documents FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert own org generated_documents"
ON public.generated_documents FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own org generated_documents"
ON public.generated_documents FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete own org generated_documents"
ON public.generated_documents FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);
