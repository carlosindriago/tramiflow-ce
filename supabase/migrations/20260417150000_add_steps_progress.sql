-- Add steps_progress JSONB column to procedures table
-- This enables tracking step-by-step progress for template-based procedures

ALTER TABLE procedures
ADD COLUMN IF NOT EXISTS steps_progress JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN procedures.steps_progress IS 
  'Mapa de progreso por paso: { "step_index_or_id": boolean }. Permite marcar pasos individuales de forma no secuencial.';

-- Index for faster queries on steps_progress (optional, for future use)
-- CREATE INDEX IF NOT EXISTS idx_procedures_steps_progress ON procedures USING GIN (steps_progress);