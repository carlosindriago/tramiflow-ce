-- ============================================================================
-- Branding Storage Bucket (Organization Logos)
-- ============================================================================
-- Public bucket for organization logos. Anyone can read, only authenticated
-- users can upload. Each user has their own folder: user_id/filename

-- Create the branding bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on objects
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- Already enabled by default/system

-- Policy 1: Public read access (anyone can view logos)
CREATE POLICY "Public can read organization logos"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'branding');

-- Policy 2: Authenticated users can upload (restricted to their own folder)
CREATE POLICY "Authenticated users can upload logos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'branding'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 3: Users can update their own uploads
CREATE POLICY "Users can update their own logos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'branding'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'branding'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 4: Users can delete their own uploads
CREATE POLICY "Users can delete their own logos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'branding'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================================================
-- Helper Function: Get folder name from path
-- ============================================================================
-- Extracts the folder name from a storage path (e.g., 'uuid/file.jpg' -> 'uuid')

-- Function already exists in system or previous migration
-- CREATE OR REPLACE FUNCTION storage.foldername(path text)
-- RETURNS text
-- LANGUAGE sql
-- IMMUTABLE
-- AS $$
--     SELECT split_part(path, '/', 1)
-- $$;

-- ============================================================================
-- Grant Permissions
-- ============================================================================
GRANT USAGE ON SCHEMA storage TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA storage TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA storage TO authenticated;

-- ============================================================================
-- Notes
-- ============================================================================
-- Folder Structure: user_id/filename.ext
-- Example: 550e8400-e29b-41d4-a716-446655440000/logo.jpg
--
-- Public URL Format: https://[project].supabase.co/storage/v1/object/public/branding/[path]
--
-- To generate signed URLs for private uploads, use:
-- SELECT storage.get_signed_url('branding', 'path', expiration);
