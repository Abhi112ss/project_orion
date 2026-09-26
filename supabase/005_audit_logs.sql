create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);

alter table public.audit_logs enable row level security;

-- Only super admins can read the log through client libraries.
create policy "Super admins can read audit logs"
  on public.audit_logs for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );

-- Deliberately no INSERT policy at all. Every write goes through the
-- service-role client (lib/supabase/admin.ts), which bypasses RLS.
-- Nobody — not even a super_admin acting through the normal client —
-- can insert their own audit entries. That's what makes the log
-- trustworthy as a record of what actually happened.