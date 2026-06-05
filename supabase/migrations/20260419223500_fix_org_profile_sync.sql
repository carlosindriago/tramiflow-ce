-- ============================================================================
-- Fix Organization Profile Sync and Heal Data
-- ============================================================================

-- 1. Restore the UPDATE to public.profiles within create_organization_with_owner
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

    -- Add creator as OWNER in junction table
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user_id, 'OWNER');

    -- Fix: Also set this as the active organization in the profile and upgrade role
    UPDATE public.profiles
    SET 
        organization_id = v_org_id,
        role = 'owner'
    WHERE id = v_user_id;

    RETURN v_org_id;
END;
$$;

-- 2. Data Healing Script: Fix any users that were left with NULL organization_id
-- We find their 'OWNER' organization from organization_members and assign it to their profile.
UPDATE public.profiles p
SET 
    organization_id = om.organization_id,
    role = 'owner'
FROM public.organization_members om
WHERE p.id = om.user_id 
  AND p.organization_id IS NULL
  AND om.role = 'OWNER';
