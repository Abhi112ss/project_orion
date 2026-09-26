-- Singleton settings row (id is always `true` — the check constraint
-- makes a second row impossible).
create table public.platform_settings (
  id boolean primary key default true,
  maintenance_mode boolean not null default false,
  maintenance_message text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  constraint platform_settings_singleton check (id = true)
);

insert into public.platform_settings (id) values (true)
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;

-- Middleware reads this on every request, before it knows who (if
-- anyone) is signed in, so it has to be readable by anon.
create policy "Anyone can read platform settings"
  on public.platform_settings for select
  to anon, authenticated
  using (true);

-- Only a super_admin may flip the switch.
create policy "Super admins can update platform settings"
  on public.platform_settings for update
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );