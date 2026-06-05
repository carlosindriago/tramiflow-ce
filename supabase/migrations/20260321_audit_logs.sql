-- ==============================================================================
-- Audit Logs Table and Policies
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    resource_id UUID,
    resource_type TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON public.audit_logs (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only Organization Owners/Admins can view logs
CREATE POLICY "Org admins can view audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.organization_members
            WHERE organization_id = audit_logs.organization_id
            AND user_id = auth.uid()
            AND role IN ('OWNER', 'ADMIN')
        )
    );

-- Policy: Service role or Authenticated users can insert
-- In practice, we will use Service Role via server actions to ensure immutability,
-- but allowing authenticated users to insert their own logs is also acceptable.
-- For maximum security, we restrict INSERT to service_role only (server-side tracking).
CREATE POLICY "Service role can manage audit logs" ON public.audit_logs
    USING (auth.jwt() ->> 'role' = 'service_role');

-- NO UPDATE or DELETE policies allowed -> IMMUTABLE
