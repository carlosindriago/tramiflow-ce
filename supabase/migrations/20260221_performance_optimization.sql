-- ============================================================================
-- Supabase Performance & Security Optimization
-- ============================================================================
-- 1. Add missing indexes for Foreign Keys
-- 2. Optimize RLS policies (wrap auth calls)
-- 3. Secure function search paths
-- ============================================================================

-- 1. Add missing indexes for Foreign Keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_procedure_id ON public.documents(procedure_id);
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON public.leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_procedure_documents_document_id ON public.procedure_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_procedure_notes_created_by ON public.procedure_notes(created_by);
CREATE INDEX IF NOT EXISTS idx_procedure_notes_procedure_id ON public.procedure_notes(procedure_id);
CREATE INDEX IF NOT EXISTS idx_procedure_statuses_organization_id ON public.procedure_statuses(organization_id);
CREATE INDEX IF NOT EXISTS idx_procedures_client_id ON public.procedures(client_id);
CREATE INDEX IF NOT EXISTS idx_procedures_created_by ON public.procedures(created_by);
CREATE INDEX IF NOT EXISTS idx_procedures_organization_id ON public.procedures(organization_id);
CREATE INDEX IF NOT EXISTS idx_procedures_status_id ON public.procedures(status_id);
CREATE INDEX IF NOT EXISTS idx_procedures_template_id ON public.procedures(template_id);
CREATE INDEX IF NOT EXISTS idx_template_leads_template_id ON public.template_leads(template_id);
CREATE INDEX IF NOT EXISTS idx_template_views_template_id ON public.template_views(template_id);

-- Optimization for get_user_organizations()
CREATE INDEX IF NOT EXISTS idx_org_members_user_created_at ON public.organization_members(user_id, created_at);



-- 2. Optimize RLS Policies (Wrap auth calls to prevent per-row re-evaluation)
-- ============================================================================

-- Categories
DROP POLICY IF EXISTS "Service role can manage categories" ON public.categories;
CREATE POLICY "Service role can manage categories" ON public.categories
    USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Users can view own org categories" ON public.categories;
CREATE POLICY "Users can view own org categories" ON public.categories
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can create categories in own org" ON public.categories;
CREATE POLICY "Users can create categories in own org" ON public.categories
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can update own org categories" ON public.categories;
CREATE POLICY "Users can update own org categories" ON public.categories
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can delete own org categories" ON public.categories;
CREATE POLICY "Users can delete own org categories" ON public.categories
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

-- Clients
DROP POLICY IF EXISTS "Users can view own org clients" ON public.clients;
CREATE POLICY "Users can view own org clients" ON public.clients
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can create own org clients" ON public.clients;
CREATE POLICY "Users can create own org clients" ON public.clients
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can update own org clients" ON public.clients;
CREATE POLICY "Users can update own org clients" ON public.clients
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can delete own org clients" ON public.clients;
CREATE POLICY "Users can delete own org clients" ON public.clients
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));


-- Documents
DROP POLICY IF EXISTS "Users can view own org documents" ON public.documents;
CREATE POLICY "Users can view own org documents" ON public.documents
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can insert own org documents" ON public.documents;
CREATE POLICY "Users can insert own org documents" ON public.documents
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can delete own org documents" ON public.documents;
CREATE POLICY "Users can delete own org documents" ON public.documents
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));


-- Leads
DROP POLICY IF EXISTS "Org members can view own leads" ON public.leads;
CREATE POLICY "Org members can view own leads" ON public.leads
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Org members can update own leads" ON public.leads;
CREATE POLICY "Org members can update own leads" ON public.leads
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));


-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = (SELECT auth.uid()));


-- Organization Members
DROP POLICY IF EXISTS "Members can view their organization memberships" ON public.organization_members;
CREATE POLICY "Members can view their organization memberships" ON public.organization_members
    FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can insert memberships" ON public.organization_members;
CREATE POLICY "Authenticated users can insert memberships" ON public.organization_members
    FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');


-- Organizations
DROP POLICY IF EXISTS "Authenticated users can insert organizations" ON public.organizations;
CREATE POLICY "Authenticated users can insert organizations" ON public.organizations
    FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Service role can manage organizations" ON public.organizations;
CREATE POLICY "Service role can manage organizations" ON public.organizations
    USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
CREATE POLICY "Users can view own organization" ON public.organizations
    FOR SELECT USING (id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Members can update their own organization" ON public.organizations;
CREATE POLICY "Members can update their own organization" ON public.organizations
    FOR UPDATE USING (id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid()) AND role IN ('OWNER', 'ADMIN')
    ));


-- Procedure Documents
DROP POLICY IF EXISTS "Users can view procedure documents for their organization" ON public.procedure_documents;
CREATE POLICY "Users can view procedure documents for their organization" ON public.procedure_documents
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.procedures p
        JOIN public.organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = procedure_documents.procedure_id AND om.user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can insert procedure documents for their organization" ON public.procedure_documents;
CREATE POLICY "Users can insert procedure documents for their organization" ON public.procedure_documents
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.procedures p
        JOIN public.organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = procedure_id AND om.user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can delete procedure documents for their organization" ON public.procedure_documents;
CREATE POLICY "Users can delete procedure documents for their organization" ON public.procedure_documents
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM public.procedures p
        JOIN public.organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = procedure_documents.procedure_id AND om.user_id = (SELECT auth.uid())
    ));


-- Procedure Notes
DROP POLICY IF EXISTS "Org members can view notes" ON public.procedure_notes;
CREATE POLICY "Org members can view notes" ON public.procedure_notes
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.procedures p
        JOIN public.organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = procedure_notes.procedure_id AND om.user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Org members can create notes" ON public.procedure_notes;
CREATE POLICY "Org members can create notes" ON public.procedure_notes
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.procedures p
        JOIN public.organization_members om ON p.organization_id = om.organization_id
        WHERE p.id = procedure_id AND om.user_id = (SELECT auth.uid())
    ));


-- Procedure Statuses
DROP POLICY IF EXISTS "Enable read access for organization members" ON public.procedure_statuses;
CREATE POLICY "Enable read access for organization members" ON public.procedure_statuses
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Enable insert access for organization members" ON public.procedure_statuses;
CREATE POLICY "Enable insert access for organization members" ON public.procedure_statuses
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Enable update access for organization members" ON public.procedure_statuses;
CREATE POLICY "Enable update access for organization members" ON public.procedure_statuses
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Enable delete access for organization members" ON public.procedure_statuses;
CREATE POLICY "Enable delete access for organization members" ON public.procedure_statuses
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));


-- Procedure Templates
DROP POLICY IF EXISTS "Service role can manage templates" ON public.procedure_templates;
CREATE POLICY "Service role can manage templates" ON public.procedure_templates
    USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Users can view own org templates" ON public.procedure_templates;
CREATE POLICY "Users can view own org templates" ON public.procedure_templates
    FOR SELECT USING (
        (visibility = 'public') OR
        organization_id IN (
            SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create templates in own org" ON public.procedure_templates;
CREATE POLICY "Users can create templates in own org" ON public.procedure_templates
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can update own org templates" ON public.procedure_templates;
CREATE POLICY "Users can update own org templates" ON public.procedure_templates
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can delete own org templates" ON public.procedure_templates;
CREATE POLICY "Users can delete own org templates" ON public.procedure_templates
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));


-- Procedures
DROP POLICY IF EXISTS "Org members can view procedures" ON public.procedures;
CREATE POLICY "Org members can view procedures" ON public.procedures
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can view own org procedures" ON public.procedures;
CREATE POLICY "Users can view own org procedures" ON public.procedures
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can create procedures in own org" ON public.procedures;
CREATE POLICY "Users can create procedures in own org" ON public.procedures
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can update own org procedures" ON public.procedures;
CREATE POLICY "Users can update own org procedures" ON public.procedures
    FOR UPDATE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can delete own org procedures" ON public.procedures;
CREATE POLICY "Users can delete own org procedures" ON public.procedures
    FOR DELETE USING (organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
    ));


-- Profiles
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
CREATE POLICY "Service role can manage profiles" ON public.profiles
    USING ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (id = (SELECT auth.uid()));


-- Template Leads
DROP POLICY IF EXISTS "Enable select for organization members" ON public.template_leads;
CREATE POLICY "Enable select for organization members" ON public.template_leads
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.procedure_templates pt
        JOIN public.organization_members om ON pt.organization_id = om.organization_id
        WHERE pt.id = template_leads.template_id AND om.user_id = (SELECT auth.uid())
    ));


-- Template Permissions
DROP POLICY IF EXISTS "Users can view permissions for their org templates" ON public.template_permissions;
CREATE POLICY "Users can view permissions for their org templates" ON public.template_permissions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.procedure_templates pt
        JOIN public.organization_members om ON pt.organization_id = om.organization_id
        WHERE pt.id = template_permissions.template_id AND om.user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can insert permissions for their org templates" ON public.template_permissions;
CREATE POLICY "Users can insert permissions for their org templates" ON public.template_permissions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.procedure_templates pt
        JOIN public.organization_members om ON pt.organization_id = om.organization_id
        WHERE pt.id = template_id AND om.user_id = (SELECT auth.uid())
    ));

DROP POLICY IF EXISTS "Users can delete permissions for their org templates" ON public.template_permissions;
CREATE POLICY "Users can delete permissions for their org templates" ON public.template_permissions
    FOR DELETE USING (EXISTS (
        SELECT 1 FROM public.procedure_templates pt
        JOIN public.organization_members om ON pt.organization_id = om.organization_id
        WHERE pt.id = template_permissions.template_id AND om.user_id = (SELECT auth.uid())
    ));


-- Template Views
DROP POLICY IF EXISTS "Enable select for organization members" ON public.template_views;
CREATE POLICY "Enable select for organization members" ON public.template_views
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.procedure_templates pt
        JOIN public.organization_members om ON pt.organization_id = om.organization_id
        WHERE pt.id = template_views.template_id AND om.user_id = (SELECT auth.uid())
    ));


-- 3. Secure Function Search Paths
-- ============================================================================

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.create_default_category() SET search_path = public;
ALTER FUNCTION public.create_organization_with_owner(TEXT, TEXT, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.create_user_profile(UUID, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.notify_new_lead() SET search_path = public;
ALTER FUNCTION public.notify_new_document() SET search_path = public;
ALTER FUNCTION public.increment_page_view(UUID) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

