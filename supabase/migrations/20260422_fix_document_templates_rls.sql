-- Fix RLS for document_templates and generated_documents using organization_members

DROP POLICY IF EXISTS "Users can view own org document_templates" ON public.document_templates;
DROP POLICY IF EXISTS "Users can insert own org document_templates" ON public.document_templates;
DROP POLICY IF EXISTS "Users can update own org document_templates" ON public.document_templates;
DROP POLICY IF EXISTS "Users can delete own org document_templates" ON public.document_templates;

CREATE POLICY "Users can view own org document_templates"
ON public.document_templates FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = document_templates.organization_id
        AND organization_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own org document_templates"
ON public.document_templates FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = document_templates.organization_id
        AND organization_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update own org document_templates"
ON public.document_templates FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = document_templates.organization_id
        AND organization_members.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = document_templates.organization_id
        AND organization_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete own org document_templates"
ON public.document_templates FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = document_templates.organization_id
        AND organization_members.user_id = auth.uid()
    )
);

-- RLS Policies for generated_documents
DROP POLICY IF EXISTS "Users can view own org generated_documents" ON public.generated_documents;
DROP POLICY IF EXISTS "Users can insert own org generated_documents" ON public.generated_documents;
DROP POLICY IF EXISTS "Users can update own org generated_documents" ON public.generated_documents;
DROP POLICY IF EXISTS "Users can delete own org generated_documents" ON public.generated_documents;

CREATE POLICY "Users can view own org generated_documents"
ON public.generated_documents FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = generated_documents.organization_id
        AND organization_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own org generated_documents"
ON public.generated_documents FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = generated_documents.organization_id
        AND organization_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update own org generated_documents"
ON public.generated_documents FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = generated_documents.organization_id
        AND organization_members.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = generated_documents.organization_id
        AND organization_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete own org generated_documents"
ON public.generated_documents FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_members.organization_id = generated_documents.organization_id
        AND organization_members.user_id = auth.uid()
    )
);
