-- Add public_settings column to procedure_templates
alter table public.procedure_templates
add column if not exists public_settings jsonb default '{"allow_copy": true, "show_fees": true, "show_requirements": true}'::jsonb;

-- Update existing rows with default
update public.procedure_templates
set public_settings = '{"allow_copy": true, "show_fees": true, "show_requirements": true}'::jsonb
where public_settings is null;
