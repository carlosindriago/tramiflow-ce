create table "public"."procedure_statuses" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null references "public"."organizations"("id") on delete cascade,
    "name" text not null,
    "color" text not null default '#000000',
    "is_final" boolean not null default false,
    "order_index" integer not null default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    primary key ("id")
);

alter table "public"."procedure_statuses" enable row level security;

create policy "Enable read access for organization members"
on "public"."procedure_statuses"
as permissive
for select
to authenticated
using (
    (auth.uid() in ( select organization_members.user_id
   from organization_members
  where (organization_members.organization_id = procedure_statuses.organization_id)))
);

create policy "Enable insert access for organization members"
on "public"."procedure_statuses"
as permissive
for insert
to authenticated
with check (
    (auth.uid() in ( select organization_members.user_id
   from organization_members
  where (organization_members.organization_id = procedure_statuses.organization_id)))
);

create policy "Enable update access for organization members"
on "public"."procedure_statuses"
as permissive
for update
to authenticated
using (
    (auth.uid() in ( select organization_members.user_id
   from organization_members
  where (organization_members.organization_id = procedure_statuses.organization_id)))
);

create policy "Enable delete access for organization members"
on "public"."procedure_statuses"
as permissive
for delete
to authenticated
using (
    (auth.uid() in ( select organization_members.user_id
   from organization_members
  where (organization_members.organization_id = procedure_statuses.organization_id)))
);

alter table "public"."procedures" add column "status_id" uuid references "public"."procedure_statuses"("id") on delete set null;

-- Optional: Create default statuses for existing organizations
do $$
declare
    org record;
    s_id uuid;
begin
    for org in select id from public.organizations loop
        -- Recopilación
        insert into public.procedure_statuses (organization_id, name, color, order_index)
        values (org.id, 'Recopilación', '#3b82f6', 0); -- Blue
        
        -- Pagos
        insert into public.procedure_statuses (organization_id, name, color, order_index)
        values (org.id, 'Pagos', '#f59e0b', 1); -- Amber
        
        -- En Proceso
        insert into public.procedure_statuses (organization_id, name, color, order_index)
        values (org.id, 'En Proceso', '#8b5cf6', 2); -- Violet
        
        -- Revisión
        insert into public.procedure_statuses (organization_id, name, color, order_index)
        values (org.id, 'Revisión', '#ec4899', 3); -- Pink
        
        -- Aprobado (Final)
        insert into public.procedure_statuses (organization_id, name, color, is_final, order_index)
        values (org.id, 'Aprobado', '#22c55e', true, 4); -- Green
        
        -- Rechazado (Final)
        insert into public.procedure_statuses (organization_id, name, color, is_final, order_index)
        values (org.id, 'Rechazado', '#ef4444', true, 5); -- Red
        
        -- Now try to update existing procedures
        -- 'pending_docs' -> 'Recopilación'
        update public.procedures set status_id = (select id from public.procedure_statuses where organization_id = org.id and name = 'Recopilación' limit 1)
        where organization_id = org.id and status = 'pending_docs';

        -- 'payment_pending' -> 'Pagos'
        update public.procedures set status_id = (select id from public.procedure_statuses where organization_id = org.id and name = 'Pagos' limit 1)
        where organization_id = org.id and status = 'payment_pending';

        -- 'in_progress' -> 'En Proceso'
        update public.procedures set status_id = (select id from public.procedure_statuses where organization_id = org.id and name = 'En Proceso' limit 1)
        where organization_id = org.id and status = 'in_progress';
        
        -- 'review' -> 'Revisión'
        update public.procedures set status_id = (select id from public.procedure_statuses where organization_id = org.id and name = 'Revisión' limit 1)
        where organization_id = org.id and status = 'review';
        
        -- 'approved' -> 'Aprobado'
        update public.procedures set status_id = (select id from public.procedure_statuses where organization_id = org.id and name = 'Aprobado' limit 1)
        where organization_id = org.id and status = 'approved';
        
        -- 'rejected' -> 'Rechazado'
        update public.procedures set status_id = (select id from public.procedure_statuses where organization_id = org.id and name = 'Rechazado' limit 1)
        where organization_id = org.id and status = 'rejected';
        
    end loop;
end;
$$;
