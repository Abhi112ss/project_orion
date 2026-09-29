/*supabase/009_phase2_core_schema.sql*/

-- Phase 2A: Student Master Data Platform — core schema.
-- Named 009_ (not "phase2_schema.sql" as the execution prompt literally
-- said) to keep this project's established sequential migration
-- numbering intact — see AI_CONTEXT_TRANSFER_PHASE2A.md for why.

create extension if not exists pg_trgm;

-- =========================================================================
-- Additive extension to Phase 1's profiles table (see design doc §0).
-- Every existing row gets company_id = null; nothing about Phase 1's
-- behavior changes.
-- Must come first so the helper functions below can reference the column.
-- =========================================================================
alter table public.profiles add column if not exists company_id uuid;

-- =========================================================================
-- Shared helpers — every RLS policy below is built from these three, so
-- the tenant/role check is written once and reasoned about once.
-- =========================================================================
create or replace function public.current_profile_role()
returns public.orion_role
language sql stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_profile_college_id()
returns uuid
language sql stable
as $$
  select college_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_profile_company_id()
returns uuid
language sql stable
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================================
-- companies
-- =========================================================================
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete restrict,
  name text not null,
  website text,
  industry text,
  description text,
  hr_name text,
  hr_email text,
  hr_phone text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_college_name_unique unique (college_id, name)
);

create index companies_college_id_idx on public.companies (college_id);
create index companies_industry_idx on public.companies (college_id, industry);

create trigger companies_set_updated_at before update on public.companies
for each row execute function public.set_updated_at();

alter table public.profiles
  add constraint profiles_company_id_fkey foreign key (company_id) references public.companies (id);

alter table public.companies enable row level security;

create policy "Staff can read their college's companies"
  on public.companies for select to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or id = current_profile_company_id()
  );

create policy "TPO/Coordinator can write their college's companies"
  on public.companies for insert to authenticated
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );

create policy "TPO/Coordinator can update their college's companies"
  on public.companies for update to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  )
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );

-- =========================================================================
-- students — the master record (see design doc §0 for why this is
-- separate from profiles)
-- =========================================================================
create type public.placement_status as enum ('not_placed', 'placed', 'opted_out', 'not_eligible');

create table public.students (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete restrict,
  profile_id uuid references public.profiles (id) on delete set null,
  roll_number text not null,
  university_number text,
  full_name text not null,
  email text not null,
  phone text,
  branch text not null,
  department text,
  section text,
  year smallint check (year is null or (year between 1 and 6)),
  admission_year smallint,
  graduation_year smallint,
  cgpa numeric(4, 2) check (cgpa is null or (cgpa >= 0 and cgpa <= 10)),
  backlogs smallint not null default 0 check (backlogs >= 0),
  skills text[] not null default '{}',
  resume_url text,
  linkedin_url text,
  github_url text,
  placement_status public.placement_status not null default 'not_placed',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_college_roll_unique unique (college_id, roll_number),
  constraint students_college_email_unique unique (college_id, email),
  constraint students_profile_unique unique (profile_id)
);

create index students_college_id_idx on public.students (college_id);
create index students_college_branch_idx on public.students (college_id, branch);
create index students_college_placement_status_idx on public.students (college_id, placement_status);
create index students_college_cgpa_idx on public.students (college_id, cgpa);
create index students_college_graduation_year_idx on public.students (college_id, graduation_year);
create index students_full_name_trgm_idx on public.students using gin (full_name gin_trgm_ops);

create trigger students_set_updated_at before update on public.students
for each row execute function public.set_updated_at();

alter table public.students enable row level security;

create policy "Staff can read their college's students; a student can read their own record"
  on public.students for select to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or profile_id = auth.uid()
  );

create policy "TPO/Coordinator can insert students for their college"
  on public.students for insert to authenticated
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );

create policy "TPO/Coordinator can update their college's students"
  on public.students for update to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  )
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );

-- =========================================================================
-- drives
-- =========================================================================
create type public.drive_status as enum ('draft', 'open', 'closed', 'completed', 'cancelled');
create type public.work_mode as enum ('onsite', 'remote', 'hybrid');

create table public.drives (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  college_id uuid not null references public.colleges (id) on delete restrict,
  title text not null,
  description text,
  job_role text,
  ctc numeric(10, 2),
  location text,
  work_mode public.work_mode,
  min_cgpa numeric(4, 2),
  allowed_branches text[] not null default '{}',
  allowed_backlogs smallint,
  registration_start timestamptz,
  registration_end timestamptz,
  drive_date timestamptz,
  status public.drive_status not null default 'draft',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index drives_company_id_idx on public.drives (company_id);
create index drives_college_status_idx on public.drives (college_id, status);
create index drives_college_drive_date_idx on public.drives (college_id, drive_date);
create index drives_registration_end_idx on public.drives (registration_end);

create trigger drives_set_updated_at before update on public.drives
for each row execute function public.set_updated_at();

alter table public.drives enable row level security;

create policy "Staff and the owning company_hr can read drives"
  on public.drives for select to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or company_id = current_profile_company_id()
  );

create policy "TPO/Coordinator can write drives for their college"
  on public.drives for insert to authenticated
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );

create policy "TPO/Coordinator can update their college's drives"
  on public.drives for update to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  )
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );

-- =========================================================================
-- applications
-- =========================================================================
create type public.application_status as enum (
  'applied', 'shortlisted', 'in_progress', 'rejected', 'selected', 'withdrawn'
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  drive_id uuid not null references public.drives (id) on delete cascade,
  college_id uuid not null references public.colleges (id) on delete restrict,
  status public.application_status not null default 'applied',
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_student_drive_unique unique (student_id, drive_id)
);

create index applications_student_id_idx on public.applications (student_id);
create index applications_drive_id_idx on public.applications (drive_id);
create index applications_college_status_idx on public.applications (college_id, status);
create index applications_drive_status_idx on public.applications (drive_id, status);

create trigger applications_set_updated_at before update on public.applications
for each row execute function public.set_updated_at();

alter table public.applications enable row level security;

create policy "Staff, the owning company_hr, and the applicant can read applications"
  on public.applications for select to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or exists (
      select 1 from public.drives d
      where d.id = applications.drive_id and d.company_id = current_profile_company_id()
    )
    or exists (
      select 1 from public.students s
      where s.id = applications.student_id and s.profile_id = auth.uid()
    )
  );

create policy "TPO/Coordinator can write applications for their college"
  on public.applications for insert to authenticated
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );

create policy "Staff and the owning company_hr can update application status"
  on public.applications for update to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or exists (
      select 1 from public.drives d
      where d.id = applications.drive_id and d.company_id = current_profile_company_id()
    )
  )
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or exists (
      select 1 from public.drives d
      where d.id = applications.drive_id and d.company_id = current_profile_company_id()
    )
  );

-- =========================================================================
-- rounds
-- =========================================================================
create type public.round_type as enum (
  'aptitude', 'technical', 'group_discussion', 'hr', 'coding', 'other'
);
create type public.round_status as enum ('scheduled', 'in_progress', 'completed', 'cancelled');

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  drive_id uuid not null references public.drives (id) on delete cascade,
  college_id uuid not null references public.colleges (id) on delete restrict,
  name text not null,
  sequence_number smallint not null,
  type public.round_type not null default 'other',
  scheduled_at timestamptz,
  status public.round_status not null default 'scheduled',
  created_at timestamptz not null default now(),
  constraint rounds_drive_sequence_unique unique (drive_id, sequence_number)
);

create index rounds_drive_id_idx on public.rounds (drive_id);

alter table public.rounds enable row level security;

create policy "Staff and the owning company_hr can read rounds"
  on public.rounds for select to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or exists (
      select 1 from public.drives d where d.id = rounds.drive_id and d.company_id = current_profile_company_id()
    )
  );

create policy "TPO/Coordinator can write rounds for their college"
  on public.rounds for insert to authenticated
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );

create policy "TPO/Coordinator can update their college's rounds"
  on public.rounds for update to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  )
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );

-- =========================================================================
-- evaluations
-- =========================================================================
create type public.evaluation_result as enum ('pass', 'fail', 'pending', 'on_hold');

create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  college_id uuid not null references public.colleges (id) on delete restrict,
  score numeric(6, 2),
  remarks text,
  result public.evaluation_result not null default 'pending',
  evaluated_by uuid references auth.users (id),
  evaluated_at timestamptz,
  constraint evaluations_round_student_unique unique (round_id, student_id)
);

create index evaluations_round_id_idx on public.evaluations (round_id);
create index evaluations_student_id_idx on public.evaluations (student_id);

alter table public.evaluations enable row level security;

create policy "Staff, the owning company_hr, and the evaluated student can read evaluations"
  on public.evaluations for select to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or exists (
      select 1 from public.rounds r
      join public.drives d on d.id = r.drive_id
      where r.id = evaluations.round_id and d.company_id = current_profile_company_id()
    )
    or exists (
      select 1 from public.students s where s.id = evaluations.student_id and s.profile_id = auth.uid()
    )
  );

create policy "Staff and the owning company_hr can write evaluations"
  on public.evaluations for insert to authenticated
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or exists (
      select 1 from public.rounds r
      join public.drives d on d.id = r.drive_id
      where r.id = evaluations.round_id and d.company_id = current_profile_company_id()
    )
  );

create policy "Staff and the owning company_hr can update evaluations"
  on public.evaluations for update to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or exists (
      select 1 from public.rounds r
      join public.drives d on d.id = r.drive_id
      where r.id = evaluations.round_id and d.company_id = current_profile_company_id()
    )
  )
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or exists (
      select 1 from public.rounds r
      join public.drives d on d.id = r.drive_id
      where r.id = evaluations.round_id and d.company_id = current_profile_company_id()
    )
  );

-- =========================================================================
-- placements
-- =========================================================================
create type public.placement_record_status as enum ('offered', 'accepted', 'declined', 'joined', 'withdrawn');

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete restrict,
  drive_id uuid references public.drives (id) on delete set null,
  college_id uuid not null references public.colleges (id) on delete restrict,
  package numeric(10, 2),
  joining_date date,
  status public.placement_record_status not null default 'offered',
  placed_at timestamptz not null default now()
);

create index placements_student_id_idx on public.placements (student_id);
create index placements_company_id_idx on public.placements (company_id);
create index placements_college_id_idx on public.placements (college_id);

alter table public.placements enable row level security;

create policy "Staff, the owning company_hr, and the placed student can read placements"
  on public.placements for select to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
    or company_id = current_profile_company_id()
    or exists (
      select 1 from public.students s where s.id = placements.student_id and s.profile_id = auth.uid()
    )
  );

create policy "TPO/Coordinator can write placements for their college"
  on public.placements for insert to authenticated
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );

create policy "TPO/Coordinator can update their college's placements"
  on public.placements for update to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  )
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );

-- =========================================================================
-- notifications
-- =========================================================================
create type public.notification_target_role as enum ('all', 'tpo', 'coordinator', 'company_hr', 'student');

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges (id) on delete cascade,
  title text not null,
  message text not null,
  type text,
  target_role public.notification_target_role not null default 'all',
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index notifications_college_created_idx on public.notifications (college_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Anyone in the college whose target_role matches can read notifications"
  on public.notifications for select to authenticated
  using (
    current_profile_role() = 'super_admin'
    or (
      current_profile_college_id() = college_id
      and (target_role = 'all' or target_role::text = current_profile_role()::text)
    )
  );

create policy "TPO/Coordinator can create notifications for their college"
  on public.notifications for insert to authenticated
  with check (
    current_profile_role() = 'super_admin'
    or (current_profile_college_id() = college_id and current_profile_role() in ('tpo', 'coordinator'))
  );