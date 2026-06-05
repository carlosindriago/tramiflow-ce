-- ============================================================================
-- Workflow Engine Migration (20260303)
-- ============================================================================
-- 1. Updates procedure_templates (requirements, fees, steps)
-- 2. Updates procedures (status enum, progress tracking)
-- 3. Updates documents to link with procedures
-- 4. Adds procedure notes (Bitácora)

-- 1. Update procedure_templates
DO $$
BEGIN
    -- Add requirements column (JSONB array of strings)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedure_templates' AND column_name = 'requirements') THEN
        ALTER TABLE public.procedure_templates ADD COLUMN requirements JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add government_fee column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedure_templates' AND column_name = 'government_fee') THEN
        ALTER TABLE public.procedure_templates ADD COLUMN government_fee DECIMAL(10, 2) DEFAULT 0;
    END IF;

    -- Add fees column (Honorarios)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedure_templates' AND column_name = 'fees') THEN
        ALTER TABLE public.procedure_templates ADD COLUMN fees DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    -- Rename/Ensure steps column exists (already in core_tables but ensuring type/default)
    -- It was defined as steps JSONB DEFAULT '[]'::jsonb in 20260210_core_tables.sql
END $$;

-- 2. Update procedures
DO $$
BEGIN
    -- Update status check constraint if it exists, or just ensure column type
    -- Current default is 'draft'. We want specific enum values.
    -- We'll drop the old default and set a new one, and add a check constraint.
    
    ALTER TABLE public.procedures ALTER COLUMN status SET DEFAULT 'pending_docs';
    
    -- Add check constraint for status
    -- statuses: 'pending_docs', 'payment_pending', 'in_progress', 'waiting_approval', 'approved', 'rejected'
    -- Note: We first drop constraint if exists to avoid errors on re-run
    ALTER TABLE public.procedures DROP CONSTRAINT IF EXISTS procedures_status_check;
    ALTER TABLE public.procedures ADD CONSTRAINT procedures_status_check 
        CHECK (status IN ('draft', 'pending_docs', 'payment_pending', 'in_progress', 'waiting_approval', 'approved', 'rejected'));
        -- Kept 'draft' for backward compatibility if needed, though goal is to move to new statuses.

    -- Add checklist_progress (JSONB map of requirement -> boolean)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'checklist_progress') THEN
        ALTER TABLE public.procedures ADD COLUMN checklist_progress JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add current_step_index
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'current_step_index') THEN
        ALTER TABLE public.procedures ADD COLUMN current_step_index INTEGER DEFAULT 0;
    END IF;
    
    -- Add honorarios status tracking (optional, but good for "Finanzas")
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'payment_status') THEN
         ALTER TABLE public.procedures ADD COLUMN payment_status TEXT DEFAULT 'pending' 
         CHECK (payment_status IN ('pending', 'partial', 'paid'));
    END IF;

    -- Add template_id FK
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'template_id') THEN
        ALTER TABLE public.procedures ADD COLUMN template_id UUID REFERENCES public.procedure_templates(id) ON DELETE SET NULL;
    END IF;

    -- Add requirements_snapshot
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'requirements_snapshot') THEN
        ALTER TABLE public.procedures ADD COLUMN requirements_snapshot JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'procedures' AND indexname = 'idx_procedures_status_workflow') THEN
        CREATE INDEX idx_procedures_status_workflow ON public.procedures(status);
    END IF;
END $$;

-- 3. Update documents (for Procedure History)
DO $$
BEGIN
    -- Add procedure_id FK
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'procedure_id') THEN
        ALTER TABLE public.documents ADD COLUMN procedure_id UUID REFERENCES public.procedures(id) ON DELETE SET NULL;
        
        -- Index for fast lookup of documents per procedure
        CREATE INDEX idx_documents_procedure_id ON public.documents(procedure_id);
    END IF;
END $$;

-- 4. Create Procedure Notes (Bitácora)
CREATE TABLE IF NOT EXISTS public.procedure_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for procedure_notes
ALTER TABLE public.procedure_notes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'procedure_notes' AND policyname = 'Org members can view notes') THEN
        CREATE POLICY "Org members can view notes" ON public.procedure_notes
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT user_id FROM public.organization_members 
                    WHERE organization_id = (SELECT organization_id FROM public.procedures WHERE id = procedure_notes.procedure_id)
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'procedure_notes' AND policyname = 'Org members can create notes') THEN
        CREATE POLICY "Org members can create notes" ON public.procedure_notes
            FOR INSERT WITH CHECK (
                auth.uid() IN (
                    SELECT user_id FROM public.organization_members 
                    WHERE organization_id = (SELECT organization_id FROM public.procedures WHERE id = procedure_notes.procedure_id)
                )
            );
    END IF;
END $$;
