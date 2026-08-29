-- =============================================================================
-- Migration: Add paper_config to document_templates and generated_documents
-- =============================================================================

ALTER TABLE public.document_templates
ADD COLUMN IF NOT EXISTS paper_config JSONB NOT NULL DEFAULT '{"format": "a4"}'::jsonb;

ALTER TABLE public.generated_documents
ADD COLUMN IF NOT EXISTS paper_config JSONB NOT NULL DEFAULT '{"format": "a4"}'::jsonb;
