-- =============================================================================
-- Migration: Add status column to document_templates and generated_documents
-- =============================================================================

ALTER TABLE public.document_templates
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
CHECK (status IN ('draft', 'published', 'archived'));

ALTER TABLE public.generated_documents
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
CHECK (status IN ('draft', 'published', 'archived'));

CREATE INDEX IF NOT EXISTS idx_document_templates_status ON public.document_templates(status);
CREATE INDEX IF NOT EXISTS idx_generated_documents_status ON public.generated_documents(status);
