-- Añadir columnas de IP si no existen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS registration_ip INET,
ADD COLUMN IF NOT EXISTS last_ip INET;

-- Actualizar el trigger para que tome la IP inicial desde los metadatos si está disponible
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, registration_ip, last_ip)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'owner',
        NULLIF(NEW.raw_user_meta_data->>'registration_ip', '')::INET,
        NULLIF(NEW.raw_user_meta_data->>'registration_ip', '')::INET
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
