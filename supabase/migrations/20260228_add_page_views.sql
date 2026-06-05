-- Add page_views column to organizations
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS page_views INTEGER DEFAULT 0;

-- Create RPC function to increment page views safely
CREATE OR REPLACE FUNCTION increment_page_view(org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE organizations
  SET page_views = page_views + 1
  WHERE id = org_id;
END;
$$;
