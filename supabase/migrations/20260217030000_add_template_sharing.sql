-- Add sharing columns to procedure_templates
ALTER TABLE procedure_templates 
ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'restricted')),
ADD COLUMN IF NOT EXISTS share_token uuid UNIQUE;

-- Create template_permissions table for restricted access
CREATE TABLE IF NOT EXISTS template_permissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id uuid NOT NULL REFERENCES procedure_templates(id) ON DELETE CASCADE,
    email text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(template_id, email)
);

-- RLS Policies for template_permissions

ALTER TABLE template_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Organization members can view permissions for templates in their org
CREATE POLICY "Users can view permissions for their org templates" ON template_permissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM procedure_templates pt
            JOIN organization_members om ON pt.organization_id = om.organization_id
            WHERE pt.id = template_permissions.template_id
            AND om.user_id = auth.uid()
        )
    );

-- Policy: Organization members can insert permissions for their org templates
CREATE POLICY "Users can insert permissions for their org templates" ON template_permissions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM procedure_templates pt
            JOIN organization_members om ON pt.organization_id = om.organization_id
            WHERE pt.id = template_permissions.template_id
            AND om.user_id = auth.uid()
        )
    );

-- Policy: Organization members can delete permissions for their org templates
CREATE POLICY "Users can delete permissions for their org templates" ON template_permissions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM procedure_templates pt
            JOIN organization_members om ON pt.organization_id = om.organization_id
            WHERE pt.id = template_permissions.template_id
            AND om.user_id = auth.uid()
        )
    );
