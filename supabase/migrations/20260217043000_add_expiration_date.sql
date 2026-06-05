-- Add expiration_date for alerts
ALTER TABLE procedures 
ADD COLUMN IF NOT EXISTS expiration_date timestamptz;

-- Add index safely
CREATE INDEX IF NOT EXISTS idx_procedures_expiration_date ON procedures(expiration_date);
