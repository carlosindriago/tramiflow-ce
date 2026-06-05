-- =============================================================================
-- CLIENT IDENTIFICATIONS: Add JSONB field for multiple ID documents
-- =============================================================================

-- Add identifications JSONB column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS identifications JSONB DEFAULT '[]'::jsonb;

-- Create index for faster queries on the JSONB column
CREATE INDEX IF NOT EXISTS idx_clients_identifications 
ON public.clients USING gin(identifications);

-- Enable RLS on the new column (existing policies will still work)
-- Note: RLS policies for clients table already handle access control

-- Comment for documentation
COMMENT ON COLUMN public.clients.identifications IS 
'Ejemplo de estructura: [{"type": "DNI", "number": "12345678"}, {"type": "Pasaporte", "number": "AB123456"}]';
