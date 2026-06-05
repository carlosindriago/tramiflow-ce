-- ==========================================
-- Create User Profile Function
-- ==========================================
-- Function to create a profile for existing users
-- Uses SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION create_user_profile(
    user_id UUID,
    user_full_name TEXT DEFAULT NULL,
    user_role TEXT DEFAULT 'owner'
)
RETURNS UUID AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (user_id, user_full_name, user_role)
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(user_full_name, profiles.full_name),
        role = COALESCE(user_role, profiles.role);

    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT) TO authenticated;
