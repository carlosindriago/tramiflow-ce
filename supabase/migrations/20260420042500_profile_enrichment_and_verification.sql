-- ==========================================
-- TramiFlow CE - Profile Enrichment & Verification
-- ==========================================

-- 1. Actualizar tabla profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMPTZ;

-- 2. Actualizar tabla organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_contact VARCHAR(20);

-- 3. Actualizar el trigger handle_new_user para NO poner el email en full_name por defecto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, registration_ip, last_ip)
    VALUES (
        NEW.id,
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''), -- Aquí se evita COALESCE(..., NEW.email)
        'owner',
        NULLIF(NEW.raw_user_meta_data->>'registration_ip', '')::INET,
        NULLIF(NEW.raw_user_meta_data->>'registration_ip', '')::INET
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
