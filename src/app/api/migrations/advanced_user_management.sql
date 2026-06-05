-- Migración para IP Tracking (Advanced User Management)
-- Agrega columnas `registration_ip` y `last_ip` a la tabla `profiles`

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS registration_ip TEXT,
ADD COLUMN IF NOT EXISTS last_ip TEXT;

-- Opcional: Agregar un comentario para documentar el propósito de las columnas
COMMENT ON COLUMN profiles.registration_ip IS 'Dirección IP registrada al momento de crear la cuenta o primer login_ip detectado.';
COMMENT ON COLUMN profiles.last_ip IS 'Última dirección IP detectada al iniciar sesión o acceder al sistema.';
