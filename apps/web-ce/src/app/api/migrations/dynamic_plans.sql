-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price_pen DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_clients INT NOT NULL,
    max_procedures INT NOT NULL,
    max_storage_mb INT NOT NULL,
    grace_allowance INT NOT NULL DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read active plans
CREATE POLICY "Everyone can read active plans" ON public.subscription_plans
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Policy: Only super_admin can modify (assuming app_admins logic or simple check)
-- For now, allowing service role or manual inserts. Refine if needed.

-- Add plan_code to organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS plan_code TEXT REFERENCES public.subscription_plans(code);

-- Seed Plans
INSERT INTO public.subscription_plans (code, name, price_pen, max_clients, max_procedures, max_storage_mb, grace_allowance)
VALUES 
    ('free', 'Plan Gratuito', 0.00, 20, 50, 100, 2),
    ('pro', 'Plan Pro', 199.00, 999999, 999999, 10240, 5)
ON CONFLICT (code) DO UPDATE SET
    max_clients = EXCLUDED.max_clients,
    max_procedures = EXCLUDED.max_procedures,
    max_storage_mb = EXCLUDED.max_storage_mb,
    grace_allowance = EXCLUDED.grace_allowance;

-- Migrate existing data (assuming plan_tier was 'free' or 'pro')
UPDATE public.organizations
SET plan_code = plan_tier::text
WHERE plan_code IS NULL AND plan_tier IS NOT NULL;

-- Default for new orgs (if not set) could be 'free'
-- ALTER TABLE public.organizations ALTER COLUMN plan_code SET DEFAULT 'free'; 
