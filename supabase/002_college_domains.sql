--/supabase/002_college_domains.sql

-- Run this once against your existing project.
-- Safe to re-run even if a previous attempt got partway through.

-- 1. Normalized domains table: many domains -> one college.
create table if not exists public.college_domains (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete cascade,
  domain text not null unique
);

alter table public.college_domains enable row level security;

drop policy if exists "Anyone can read college domains" on public.college_domains;
create policy "Anyone can read college domains"
  on public.college_domains for select
  to anon, authenticated
  using (true);

-- 2. Carry over whatever's already in colleges.email_domain, if that
-- column still exists (a re-run after step 4 already dropped it will
-- just find nothing to do here — that's fine).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'colleges' and column_name = 'email_domain'
  ) then
    insert into public.college_domains (college_id, domain)
    select id, email_domain from public.colleges
    where email_domain is not null
    on conflict (domain) do nothing;
  end if;
end $$;

-- 3. Drop the OLD policy first — it references colleges.email_domain,
-- so the column can't be dropped while this policy still exists.
drop policy if exists "Students can self-provision if their college's domain matches" on public.profiles;

-- 4. Now the old single-domain column can go (no-op if already gone).
alter table public.colleges drop column if exists email_domain;

-- 5. Recreate the policy pointing at the new table.
create policy "Students can self-provision if their college's domain matches"
  on public.profiles for insert
  to authenticated
  with check (
    auth.uid() = id
    and role = 'student'
    and email = (auth.jwt() ->> 'email')
    and exists (
      select 1 from public.college_domains d
      where d.college_id = college_id
        and d.domain = split_part(email, '@', 2)
    )
  );

-- 6. Rename your existing MRCET row to match the full-name convention
-- (no-op if it's already been renamed or never existed under this name).
update public.colleges
set name = 'Malla Reddy College of Engineering & Technology (MRCET)'
where name = 'MRCET';

-- 7. Add the rest of the group, skipping any that already exist by name.
insert into public.colleges (name)
select v.name from (values
  ('Malla Reddy University (MRU)'),
  ('Malla Reddy Engineering College (MREC - Autonomous)'),
  ('Malla Reddy Engineering College for Women (MRECW)'),
  ('Malla Reddy Institute of Engineering and Technology (MRIET)'),
  ('Malla Reddy Vishwavidyapeeth (MRVV)')
) as v(name)
where not exists (select 1 from public.colleges c where c.name = v.name);

-- 8. Attach domains (MRU gets two rows), skipping any already present.
insert into public.college_domains (college_id, domain)
select id, 'mallareddyuniversity.ac.in' from public.colleges where name = 'Malla Reddy University (MRU)'
union all
select id, 'mru.edu.in' from public.colleges where name = 'Malla Reddy University (MRU)'
union all
select id, 'mrec.ac.in' from public.colleges where name = 'Malla Reddy Engineering College (MREC - Autonomous)'
union all
select id, 'mrecw.ac.in' from public.colleges where name = 'Malla Reddy Engineering College for Women (MRECW)'
union all
select id, 'mriet.ac.in' from public.colleges where name = 'Malla Reddy Institute of Engineering and Technology (MRIET)'
union all
select id, 'mrvv.edu.in' from public.colleges where name = 'Malla Reddy Vishwavidyapeeth (MRVV)'
on conflict (domain) do nothing;