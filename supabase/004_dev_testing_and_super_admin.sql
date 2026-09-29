--supabase/004_dev_testing_and_super_admin.sql

-- Run this AFTER 003_add_super_admin_role.sql has been run and committed
-- as its own separate query.

-- =========================================================================
-- DEV-ONLY: lets any @gmail.com address self-register as a student, for
-- testing the OTP/Google student flow without a real institutional inbox.
-- Only ever produces role = 'student' (provisionStudentProfile hardcodes
-- that), so this can't be used to escalate privilege — but it does mean
-- any Gmail user can self-register as a student while this row exists.
-- DELETE THIS ROW (and this college) BEFORE PRODUCTION LAUNCH.
-- =========================================================================
insert into public.colleges (name)
select 'Development / Testing (REMOVE BEFORE LAUNCH)'
where not exists (
  select 1 from public.colleges where name = 'Development / Testing (REMOVE BEFORE LAUNCH)'
);

insert into public.college_domains (college_id, domain)
select id, 'gmail.com' from public.colleges
where name = 'Development / Testing (REMOVE BEFORE LAUNCH)'
on conflict (domain) do nothing;

-- =========================================================================
-- Super admin provisioning.
-- Replace the id below with the auth.users UID you confirmed in the
-- Supabase dashboard belongs to abhiramreddy350@gmail.com.
-- super_admin bypasses every role check (see requireRole /
-- canAccessRole), so it isn't scoped to a college — college_id is null.
-- =========================================================================
insert into public.profiles (id, email, full_name, role, college_id, permissions, is_active)
values (
  'b1bce909-3bbb-4da2-907a-162e8e907369', -- verify this UID first
  'abhiramreddy350@gmail.com',
  'Abhi Ram Reddy (Super Admin)',
  'super_admin',
  null,
  array['*'],
  true
)
on conflict (id) do update set
  role = excluded.role,
  permissions = excluded.permissions,
  is_active = excluded.is_active;