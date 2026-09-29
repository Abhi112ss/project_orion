/*supabase/007_feature_flags.sql*/

create table public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

insert into public.feature_flags (key, enabled, description) values
  ('FEATURE_EMAILS', false, 'Outbound transactional emails beyond Supabase Auth (drive notifications, etc.)'),
  ('FEATURE_AI', false, 'AI-assisted features (resume screening, matching, etc.)'),
  ('FEATURE_ANALYTICS', false, 'Analytics/reporting dashboards')
on conflict (key) do nothing;

alter table public.feature_flags enable row level security;

-- Readable by anyone — a flag check may happen before a full session
-- is established, same reasoning as colleges/college_domains/platform_settings.
create policy "Anyone can read feature flags"
  on public.feature_flags for select
  to anon, authenticated
  using (true);

create policy "Super admins can update feature flags"
  on public.feature_flags for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));

-- Note: FEATURE_MAINTENANCE_MODE is NOT duplicated here — it already
-- exists as platform_settings.maintenance_mode, which is checked in
-- middleware before any auth context exists and carries its own
-- message field. Two separate mechanisms for two different jobs:
-- platform_settings gates the whole site pre-auth; feature_flags gates
-- individual features inside already-authenticated dashboards.