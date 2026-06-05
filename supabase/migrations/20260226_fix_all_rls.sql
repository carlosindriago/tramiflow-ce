-- ==========================================
-- Fix RLS for CATEGORIES
-- ==========================================
DROP POLICY IF EXISTS "Users can view own org categories" ON categories;
DROP POLICY IF EXISTS "Users can create categories in own org" ON categories;
DROP POLICY IF EXISTS "Users can update own org categories" ON categories;
DROP POLICY IF EXISTS "Users can delete own org categories" ON categories;

CREATE POLICY "Users can view own org categories" ON categories
    FOR SELECT USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = categories.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create categories in own org" ON categories
    FOR INSERT WITH CHECK (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = categories.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own org categories" ON categories
    FOR UPDATE USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = categories.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own org categories" ON categories
    FOR DELETE USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = categories.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

-- ==========================================
-- Fix RLS for DOCUMENTS
-- ==========================================
DROP POLICY IF EXISTS "Users can view own org documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own org documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own org documents" ON documents;

CREATE POLICY "Users can view own org documents" ON documents
    FOR SELECT USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = documents.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own org documents" ON documents
    FOR INSERT WITH CHECK (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = documents.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own org documents" ON documents
    FOR DELETE USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = documents.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

-- ==========================================
-- Fix RLS for PROCEDURE_TEMPLATES
-- ==========================================
DROP POLICY IF EXISTS "Users can view own org templates" ON procedure_templates;
DROP POLICY IF EXISTS "Users can create templates in own org" ON procedure_templates;
DROP POLICY IF EXISTS "Users can update own org templates" ON procedure_templates;
DROP POLICY IF EXISTS "Users can delete own org templates" ON procedure_templates;

-- Preserve "Anyone can view public templates" if logic is correct, assuming public templates don't check org membership?
-- But usually templates belong to org. If public, maybe it's system templates?
-- Let's keep existing public policy if it doesn't use profiles.
-- The public policy was: (is_publicly_visible = true). This is fine.

CREATE POLICY "Users can view own org templates" ON procedure_templates
    FOR SELECT USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = procedure_templates.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create templates in own org" ON procedure_templates
    FOR INSERT WITH CHECK (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = procedure_templates.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own org templates" ON procedure_templates
    FOR UPDATE USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = procedure_templates.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own org templates" ON procedure_templates
    FOR DELETE USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = procedure_templates.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

-- ==========================================
-- ADD RLS for PROCEDURES (Missing!)
-- ==========================================
-- Enable RLS just in case
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org procedures" ON procedures
    FOR SELECT USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = procedures.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create procedures in own org" ON procedures
    FOR INSERT WITH CHECK (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = procedures.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own org procedures" ON procedures
    FOR UPDATE USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = procedures.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own org procedures" ON procedures
    FOR DELETE USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = procedures.organization_id
            and organization_members.user_id = auth.uid()
        )
    );
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own org clients" ON clients;
DROP POLICY IF EXISTS "Users can create own org clients" ON clients;
DROP POLICY IF EXISTS "Users can update own org clients" ON clients;
DROP POLICY IF EXISTS "Users can delete own org clients" ON clients;

-- Create new policies using organization_members
CREATE POLICY "Users can view own org clients" ON clients
    FOR SELECT
    USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = clients.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own org clients" ON clients
    FOR INSERT
    WITH CHECK (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = clients.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own org clients" ON clients
    FOR UPDATE
    USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = clients.organization_id
            and organization_members.user_id = auth.uid()
        )
    )
    WITH CHECK (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = clients.organization_id
            and organization_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own org clients" ON clients
    FOR DELETE
    USING (
        exists (
            select 1 from organization_members
            where organization_members.organization_id = clients.organization_id
            and organization_members.user_id = auth.uid()
        )
    );
