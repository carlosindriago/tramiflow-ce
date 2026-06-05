-- ==========================================
-- TramiFlow CE - Core Tables Migration
-- ==========================================
-- Multi-tenant architecture for SaaS
--
-- Tables:
-- - organizations: Tenant/Company accounts
-- - profiles: User profiles linked to organizations
-- - procedure_templates: Template definitions per organization

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- Organizations (Multi-tenant)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Profiles
-- ==========================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,

    -- Profile info
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'member',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT role_valid CHECK (role IN ('owner', 'admin', 'member'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Procedure Templates
-- ==========================================
CREATE TABLE IF NOT EXISTS public.procedure_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),

    -- Template info
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,

    -- Configuration
    base_cost DECIMAL(10, 2) DEFAULT 0,
    estimated_days INTEGER DEFAULT 30,

    -- Steps (JSONB array)
    steps JSONB DEFAULT '[]'::jsonb,

    -- State
    is_active BOOLEAN DEFAULT true,
    is_publicly_visible BOOLEAN DEFAULT true,
    share_url TEXT UNIQUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT share_url_format CHECK (share_url ~* '^[a-z0-9-]+$' OR share_url IS NULL),
    CONSTRAINT estimated_days_positive CHECK (estimated_days > 0),
    CONSTRAINT base_cost_positive CHECK (base_cost >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_procedure_templates_organization_id ON public.procedure_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_procedure_templates_created_by ON public.procedure_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_procedure_templates_category ON public.procedure_templates(category);
CREATE INDEX IF NOT EXISTS idx_procedure_templates_share_url ON public.procedure_templates(share_url) WHERE share_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_procedure_templates_created_at ON public.procedure_templates(created_at DESC);

-- Partial index for public templates
CREATE INDEX IF NOT EXISTS idx_procedure_templates_public
ON public.procedure_templates(organization_id, created_at DESC)
WHERE is_publicly_visible = true;

-- Trigger for updated_at
CREATE TRIGGER update_procedure_templates_updated_at
    BEFORE UPDATE ON public.procedure_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_templates ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- RLS Policies: Organizations
-- ==========================================

-- Users can view their own organization
CREATE POLICY "Users can view own organization"
ON public.organizations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.organization_id = organizations.id
    )
);

-- Service role can do everything (bypass for background jobs)
CREATE POLICY "Service role can manage organizations"
ON public.organizations FOR ALL
USING ((select current_setting('request.jwt.claim.role', true)) = 'service_role')
WITH CHECK ((select current_setting('request.jwt.claim.role', true)) = 'service_role');

-- ==========================================
-- RLS Policies: Profiles
-- ==========================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid());

-- Users can view profiles in same organization
CREATE POLICY "Users can view org profiles"
ON public.profiles FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- Service role bypass
CREATE POLICY "Service role can manage profiles"
ON public.profiles FOR ALL
USING ((select current_setting('request.jwt.claim.role', true)) = 'service_role')
WITH CHECK ((select current_setting('request.jwt.claim.role', true)) = 'service_role');

-- ==========================================
-- RLS Policies: Procedure Templates
-- ==========================================

-- Users can view templates from their org
CREATE POLICY "Users can view own org templates"
ON public.procedure_templates FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- Anyone can view public templates (for shared links)
CREATE POLICY "Anyone can view public templates"
ON public.procedure_templates FOR SELECT
USING (is_publicly_visible = true);

-- Users can create templates for their org
CREATE POLICY "Users can create templates in own org"
ON public.procedure_templates FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
    AND created_by = auth.uid()
);

-- Users can update templates in their org
CREATE POLICY "Users can update own org templates"
ON public.procedure_templates FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- Users can delete templates in their org
CREATE POLICY "Users can delete own org templates"
ON public.procedure_templates FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- Service role bypass
CREATE POLICY "Service role can manage templates"
ON public.procedure_templates FOR ALL
USING ((select current_setting('request.jwt.claim.role', true)) = 'service_role')
WITH CHECK ((select current_setting('request.jwt.claim.role', true)) = 'service_role');

-- ==========================================
-- Helper Functions
-- ==========================================

-- Function to create organization and assign user as owner
CREATE OR REPLACE FUNCTION create_organization_with_owner(
    org_name TEXT,
    user_id UUID DEFAULT auth.uid()
)
RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Create organization
    INSERT INTO public.organizations (name)
    VALUES (org_name)
    RETURNING id INTO new_org_id;

    -- Update user's profile
    UPDATE public.profiles
    SET
        organization_id = new_org_id,
        role = 'owner'
    WHERE id = user_id;

    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_organization_with_owner(TEXT, UUID) TO authenticated;
