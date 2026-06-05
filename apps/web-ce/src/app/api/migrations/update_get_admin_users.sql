-- We need to update the `get_admin_users` RPC to include `last_ip` from profiles 
-- and `is_banned` which theoretically comes from auth.users.
-- Since we can't easily join auth.users in a standard query from public schema without high privilege,
-- we'll rely on our profiles table `last_ip` for now.

-- If `is_banned` must be shown, we should fetch it via service role in the server action or a safe view.
-- For UI purposes, we'll update the RPC to just include `last_ip` from profiles.

CREATE OR REPLACE FUNCTION public.get_admin_users(search_text text DEFAULT ''::text)
 RETURNS TABLE(id uuid, email character varying, created_at timestamp with time zone, last_sign_in_at timestamp with time zone, full_name text, avatar_url text, organization_name text, admin_role text, last_ip text, is_banned boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email::varchar,
        u.created_at,
        u.last_sign_in_at,
        p.full_name,
        p.avatar_url,
        o.name AS organization_name,
        a.role::text AS admin_role,
        p.last_ip,
        (u.banned_until IS NOT NULL AND u.banned_until > now()) AS is_banned
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    LEFT JOIN public.organizations o ON o.id = p.organization_id
    LEFT JOIN public.app_admins a ON a.user_id = u.id
    WHERE 
        (search_text = '' OR 
         u.email ILIKE '%' || search_text || '%' OR 
         p.full_name ILIKE '%' || search_text || '%' OR
         u.id::text = search_text);
END;
$function$;
