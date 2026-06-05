-- Fix: Allow Organization Owners and Admins to update their organization details
-- (Required for saving public_settings and other fields)

CREATE POLICY "Members can update their own organization"
ON public.organizations
FOR UPDATE
USING (
   auth.uid() IN (
       SELECT user_id FROM organization_members
       WHERE organization_id = id
       AND (role = 'OWNER' OR role = 'ADMIN')
   )
);
