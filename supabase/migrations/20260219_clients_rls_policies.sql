-- =============================================================================
-- CLIENTS RLS POLICIES: Allow org members to CRUD their own clients
-- =============================================================================

-- SELECT: Users can view clients in their organization
CREATE POLICY "Users can view own org clients"
ON public.clients FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- INSERT: Users can create clients in their organization
CREATE POLICY "Users can create own org clients"
ON public.clients FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- UPDATE: Users can update clients in their organization
CREATE POLICY "Users can update own org clients"
ON public.clients FOR UPDATE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- DELETE: Users can delete clients in their organization
CREATE POLICY "Users can delete own org clients"
ON public.clients FOR DELETE
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);
