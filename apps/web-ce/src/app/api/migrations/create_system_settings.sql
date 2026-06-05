-- Create system_settings table
create table if not exists system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

-- Enable RLS
alter table system_settings enable row level security;

-- Policies
create policy "Authenticated users can read settings"
  on system_settings for select
  to authenticated
  using (true);

create policy "Super admins can insert settings"
  on system_settings for insert
  to authenticated
  with check (
    exists (
      select 1 from app_admins
      where user_id = auth.uid()
      and role = 'super_admin'
    )
  );

create policy "Super admins can update settings"
  on system_settings for update
  to authenticated
  using (
    exists (
      select 1 from app_admins
      where user_id = auth.uid()
      and role = 'super_admin'
    )
  );

-- Seed initial payment config
insert into system_settings (key, value)
values (
  'payment_config',
  '{
    "yape": {"number": "900 000 000", "name": "TramiFlow SAC", "active": true},
    "plin": {"number": "900 000 000", "active": false},
    "bank": {"account": "BCP 191-12345678-0-99", "cci": "002-191-001234567809-99", "name": "TramiFlow SAC", "active": true},
    "price": {"amount": 79.00, "currency": "PEN", "name": "Plan PRO Mensual"}
  }'::jsonb
)
on conflict (key) do nothing;
