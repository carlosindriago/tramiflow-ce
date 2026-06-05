-- Migration to fix procedures table schema drift
DO $$
BEGIN
    -- Add 'title' column (matching actions.ts usage)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'title') THEN
        ALTER TABLE public.procedures ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled Procedure';
    END IF;

    -- Add 'description' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'description') THEN
        ALTER TABLE public.procedures ADD COLUMN description TEXT;
    END IF;

    -- Add timestamps if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'created_at') THEN
        ALTER TABLE public.procedures ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'updated_at') THEN
        ALTER TABLE public.procedures ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add created_by if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'procedures' AND column_name = 'created_by') THEN
         ALTER TABLE public.procedures ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;

    -- Add missing Foreign Keys
    
    -- template_id FK (Critical for PGRST200 error)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'procedures_template_id_fkey') THEN
        -- Check if index exists first to avoid dupes? No, constraint name is unique.
        ALTER TABLE public.procedures
        ADD CONSTRAINT procedures_template_id_fkey
        FOREIGN KEY (template_id)
        REFERENCES public.procedure_templates(id)
        ON DELETE SET NULL;
    END IF;

    -- organization_id FK
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'procedures_organization_id_fkey') THEN
        ALTER TABLE public.procedures
        ADD CONSTRAINT procedures_organization_id_fkey
        FOREIGN KEY (organization_id)
        REFERENCES public.organizations(id)
        ON DELETE CASCADE;
    END IF;

END $$;

-- Force schema cache reload just in case
NOTIFY pgrst, 'reload schema';
