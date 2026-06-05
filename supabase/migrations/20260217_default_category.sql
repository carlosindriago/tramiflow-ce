-- Fix: Change slug UNIQUE to be per-organization (organization_id, slug)
-- Drop the existing unique constraint on slug
ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;

-- Add composite unique constraint (organization_id, slug)
ALTER TABLE public.categories ADD CONSTRAINT categories_organization_slug_key UNIQUE (organization_id, slug);

-- Insert "General" category for all existing organizations
INSERT INTO public.categories (organization_id, name, slug, description, color)
SELECT
    id as organization_id,
    'General' as name,
    'general' as slug,
    'Categoría general para trámites sin clasificación específica' as description,
    'default' as color
FROM public.organizations
WHERE NOT EXISTS (
    SELECT 1 FROM public.categories
    WHERE categories.slug = 'general'
    AND categories.organization_id = organizations.id
);

-- Trigger function to create "General" category automatically for new organizations
CREATE OR REPLACE FUNCTION public.create_default_category()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert "General" category for new organization
    INSERT INTO public.categories (organization_id, name, slug, description, color)
    VALUES (
        NEW.id,
        'General',
        'general',
        'Categoría general para trámites sin clasificación específica',
        'default'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;

-- Create trigger to call the function after organization creation
CREATE TRIGGER on_organization_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_category();

-- Add comment
COMMENT ON FUNCTION public.create_default_category() IS 'Automatically creates a "General" category when a new organization is created';
