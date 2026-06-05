-- ==========================================
-- Categories Table (WordPress-style)
-- ==========================================
-- Manages template categories with full CRUD support

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Category info
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,

    -- Settings
    color TEXT DEFAULT 'default', -- default, blue, green, amber, red, purple
    icon TEXT, -- lucide icon name

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT name_not_empty CHECK (length(trim(name)) > 0),
    CONSTRAINT slug_format CHECK (slug ~* '^[a-z0-9-]+$')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_categories_organization_id ON public.categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Trigger for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own org categories"
ON public.categories FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can create categories in own org"
ON public.categories FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can update own org categories"
ON public.categories FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can delete own org categories"
ON public.categories FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

CREATE POLICY "Service role can manage categories"
ON public.categories FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Insert predefined categories for existing organizations
-- This will be executed once, then can be removed
-- (uncomment if needed)
-- INSERT INTO public.categories (organization_id, name, slug, description, color)
-- SELECT
--     o.id,
--     'Residencia',
--     'residencia',
--     'Trámites de residencia temporal',
--     'blue'
-- FROM public.organizations o
-- WHERE NOT EXISTS (
--     SELECT 1 FROM public.categories c WHERE c.organization_id = o.id AND c.slug = 'residencia'
-- );
