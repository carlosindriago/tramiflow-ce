-- Add tracking for template cloning
alter table public.procedure_templates
add column if not exists source_template_id uuid references public.procedure_templates(id),
add column if not exists source_ip_country text;

-- Add index for performance on analytics
create index if not exists idx_procedure_templates_source_id on public.procedure_templates(source_template_id);
