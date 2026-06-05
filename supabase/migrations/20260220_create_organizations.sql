-- ============================================================================
-- Organizations Table (Multi-tenant Architecture)
-- ============================================================================
-- Core table for multi-tenant system. Each user can belong to multiple
-- organizations (teams) with different roles: OWNER, ADMIN, MEMBER.

-- ============================================================================
-- Organizations Table (Multi-tenant Architecture)
-- ============================================================================
-- Core table for multi-tenant system. Each user can belong to multiple
-- organizations (teams) with different roles: OWNER, ADMIN, MEMBER.

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safely add columns and constraints if the table already exists (from 20260210)
DO $$
BEGIN
    -- Add 'plan' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'plan') THEN
        ALTER TABLE public.organizations ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';
    END IF;

    -- Add 'created_by' column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'created_by') THEN
        -- Add as nullable first to handle existing data
        ALTER TABLE public.organizations ADD COLUMN created_by UUID;
        
        -- Update existing rows with a placeholder UUID (nil UUID) to allow setting NOT NULL
        UPDATE public.organizations SET created_by = '00000000-0000-0000-0000-000000000000' WHERE created_by IS NULL;
        
        -- Now enforce NOT NULL
        ALTER TABLE public.organizations ALTER COLUMN created_by SET NOT NULL;
    END IF;

    -- Ensure 'name' is UNIQUE
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'organizations' AND constraint_name = 'organizations_name_key') THEN
        -- Check if we can apply unique constraint (no duplicates)
        -- If duplicates exist, this will fail, which is intended behavior (data fix needed)
        BEGIN
            ALTER TABLE public.organizations ADD CONSTRAINT organizations_name_key UNIQUE (name);
        EXCEPTION WHEN unique_violation THEN
            RAISE NOTICE 'Could not add unique constraint to organizations.name due to duplicate values';
        END;
    END IF;

    -- Ensure 'created_by' index exists
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'organizations' AND indexname = 'idx_organizations_created_by') THEN
        CREATE INDEX idx_organizations_created_by ON public.organizations(created_by);
    END IF;

    -- Ensure constraints from CREATE TABLE are applied if missing
    -- slug format
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'organizations' AND constraint_name = 'organizations_slug_format') THEN
         ALTER TABLE public.organizations ADD CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9-]+$');
    END IF;
     -- name min length
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'organizations' AND constraint_name = 'organizations_name_min_length') THEN
         ALTER TABLE public.organizations ADD CONSTRAINT organizations_name_min_length CHECK (char_length(name) >= 3);
    END IF;
    -- name max length
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'organizations' AND constraint_name = 'organizations_name_max_length') THEN
         ALTER TABLE public.organizations ADD CONSTRAINT organizations_name_max_length CHECK (char_length(name) <= 100);
    END IF;

END $$;

-- ============================================================================
-- Organization Members Junction Table
-- ============================================================================
-- Many-to-many relationship between users and organizations with roles.

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Simple UUID (no FK to auth.users which is in different schema)
    role TEXT NOT NULL DEFAULT 'MEMBER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints: One user-role pair per organization
    UNIQUE(organization_id, user_id),

    -- Valid roles
    CONSTRAINT organization_members_valid_role CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.organization_members(user_id);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Public read (anyone can see org metadata)
CREATE POLICY "Organizations are publicly readable"
    ON public.organizations FOR SELECT
    USING (true);

-- Only authenticated users can insert (will be further restricted by triggers)
CREATE POLICY "Authenticated users can insert organizations"
    ON public.organizations FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Enable RLS on organization_members
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Users can see organizations they belong to
CREATE POLICY "Members can view their organization memberships"
    ON public.organization_members FOR SELECT
    USING (auth.uid() = user_id);

-- Only authenticated users can insert (triggers will handle validation)
CREATE POLICY "Authenticated users can insert memberships"
    ON public.organization_members FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- Function: Create Organization with Owner
-- ============================================================================
-- Automatically creates the organization and adds the creator as OWNER.

CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
    p_name TEXT,
    p_slug TEXT,
    p_logo_url TEXT DEFAULT NULL,
    p_plan TEXT DEFAULT 'free'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_slug_normalized TEXT;
    v_user_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();

    -- Normalize slug: lowercase, replace spaces with hyphens, remove special chars
    v_slug_normalized := lower(trim(p_slug));
    v_slug_normalized := regexp_replace(v_slug_normalized, '[^a-z0-9-]', '-', 'g');
    v_slug_normalized := regexp_replace(v_slug_normalized, '-+', '-', 'g');
    v_slug_normalized := trim(v_slug_normalized, '-');

    -- Create the organization
    INSERT INTO public.organizations (name, slug, logo_url, plan, created_by)
    VALUES (p_name, v_slug_normalized, p_logo_url, p_plan, v_user_id)
    RETURNING id INTO v_org_id;

    -- Add creator as OWNER
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'OWNER');

    RETURN v_org_id;
END;
$$;

-- ============================================================================
-- Function: Get User Organizations
-- ============================================================================
-- Returns all organizations where the user is a member with their role.

CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    logo_url TEXT,
    plan TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id,
        o.name,
        o.slug,
        o.logo_url,
        o.plan,
        om.role
    FROM public.organizations o
    INNER JOIN public.organization_members om
        ON om.organization_id = o.id
    WHERE om.user_id = auth.uid()
    ORDER BY om.created_at ASC;
END;
$$;

-- ============================================================================
-- Trigger: Validate Unique Name Before Insert
-- ============================================================================
-- Provides better error message for duplicate organization names.

CREATE OR REPLACE FUNCTION public.validate_unique_organization_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if name already exists (case-insensitive)
    SELECT EXISTS(
        SELECT 1 FROM public.organizations
        WHERE LOWER(name) = LOWER(NEW.name)
        AND id != COALESCE(NEW.id, gen_random_uuid())
    ) INTO v_exists;

    IF v_exists THEN
        RAISE EXCEPTION 'Organization name already exists: %', NEW.name
            USING ERRCODE = '23505';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_organization_name
    BEFORE INSERT OR UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_unique_organization_name();

-- ============================================================================
-- Grant Permissions
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
