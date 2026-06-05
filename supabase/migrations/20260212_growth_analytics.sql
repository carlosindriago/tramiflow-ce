-- Create template_views table
create table if not exists public.template_views (
  id bigint generated always as identity primary key,
  template_id uuid references public.procedure_templates(id) on delete cascade not null,
  device_type text,
  created_at timestamptz default now() not null
);

-- Create template_leads table
create table if not exists public.template_leads (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references public.procedure_templates(id) on delete cascade not null,
  name text not null,
  phone text not null,
  email text,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.template_views enable row level security;
alter table public.template_leads enable row level security;

-- Policies for template_views
-- Allow public insert (for tracking views from shared links)
create policy "Enable insert for everyone"
on public.template_views for insert
to anon, authenticated
with check (true);

-- Allow select only for organization members
create policy "Enable select for organization members"
on public.template_views for select
to authenticated
using (
  exists (
    select 1 from public.procedure_templates pt
    join public.profiles p on p.organization_id = pt.organization_id
    where pt.id = template_views.template_id
    and p.id = auth.uid()
  )
);

-- Policies for template_leads
-- Allow public insert (for lead capture)
create policy "Enable insert for everyone"
on public.template_leads for insert
to anon, authenticated
with check (true);

-- Allow select only for organization members
create policy "Enable select for organization members"
on public.template_leads for select
to authenticated
using (
  exists (
    select 1 from public.procedure_templates pt
    join public.profiles p on p.organization_id = pt.organization_id
    where pt.id = template_leads.template_id
    and p.id = auth.uid()
  )
);
