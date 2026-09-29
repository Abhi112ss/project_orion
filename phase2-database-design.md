# Phase 2 Database Architecture Design

Written before any SQL, per the execution prompt's own rule. This
covers all 9 modules, their relationships, indexing strategy, and the
scale/performance reasoning behind each decision.

## 0. A decision this design depends on: linking `students` to `profiles`

Phase 1's `profiles` table is the **authentication identity** — one row
per person who has actually logged in, with a `role`. Phase 2's
`students` table is the **institutional master record** — one row per
student the college has on file, most of whom will never log in at all
(a TPO manages placement data for students who don't need portal
access), and some of whom will self-register via Phase 1's domain-gated
OTP flow.

These are deliberately **separate tables**, linked by a nullable
`students.profile_id`:

- Bulk import creates `students` rows with `profile_id = null`.
- When someone self-registers as a student (Phase 1 flow, unchanged),
  their `profiles` row is created exactly as before. Separately, if
  their email matches an existing unlinked `students` row in the same
  college, the two get linked (`students.profile_id` set) — this
  happens in application code at registration time, not a DB trigger,
  so it's easy to see and log when a match occurs.
- A student who logs in before ever being imported still works exactly
  as Phase 1 designed — `students.profile_id` being unset doesn't block
  authentication, it only means "no master record yet" for placement
  purposes.

This keeps Phase 1's auth architecture completely untouched — nothing
about `profiles`, `getSessionBundle`, or the login flow changes for the
student login case.

**One additive, backward-compatible extension to `profiles` is
necessary**: `company_id` (nullable, references the new `companies`
table). Without it, a `company_hr` profile has no way to be scoped to
*which* company they represent, which makes RLS on `drives` and
`applications` for that role meaningless. Every existing `profiles` row
gets `company_id = null` and is completely unaffected — this is an
addition, not a modification of Phase 1's behavior.

## 1. Multi-tenancy: `college_id` on every table

Every business table in this design carries `college_id` directly —
even ones where it's technically derivable through a join (e.g.
`applications.college_id` could be read from `drives.college_id`).
This is denormalization on purpose: at 50,000+ students and their
associated applications/evaluations, an RLS policy that has to join
through 2–3 tables to find the tenant boundary is both slower and
harder to audit than one that checks a column on the row itself. Every
RLS policy in this design checks `college_id` directly, never through
a join chain.

Two small helper SQL functions make this practical to write and read:

```sql
current_profile_role()       -- role of auth.uid(), or null
current_profile_college_id() -- college_id of auth.uid(), or null
current_profile_company_id() -- company_id of auth.uid(), or null (company_hr only)
```

Every policy in this design is built from these three, so a reviewer
never has to re-derive "how does this table know who can see it" from
scratch per table.

## 2. Table-by-table

### `students` — the master record
- `college_id`, `profile_id` (nullable, see §0)
- `roll_number`, `university_number` (nullable — not in the reference
  data yet), `full_name`, `email`, `phone`
- `branch` (short code: CSE/ECE/EEE/CIVIL/IT/MECH per the reference
  data), `department` (the broader school name — e.g. "CSE" branch
  sits under "Computer Science & Engineering" department; kept as a
  separate free-text column rather than a lookup table for now, since
  the mapping isn't 1:1 across colleges and a wrong FK constraint would
  block legitimate imports)
- `section`, `year` (current year of study) — both nullable; not
  present in the reference CSV, but real schools do track them, so
  they're columns, not client-side extras bolted on later
- `admission_year`, `graduation_year` — parsed at import time from the
  reference data's `"2022-2026"` format into two integers, rather than
  storing the raw range string
- `cgpa numeric(4,2)`, `backlogs smallint`
- `skills text[]`, `resume_url`, `linkedin_url`, `github_url` — all
  nullable; not in the reference data, populated later (self-service
  profile edit, or a future richer import) once that feature exists
- `placement_status` enum, `is_active`, `created_at`, `updated_at`

**Uniqueness is scoped per college**, not global —
`unique(college_id, roll_number)` and `unique(college_id, email)`. Roll
numbers are only unique *within* an institution; a global unique
constraint would make onboarding a second college with overlapping
roll-number schemes impossible.

**Search**: name search uses `pg_trgm` + a GIN index for fast
partial/case-insensitive `ILIKE` matching at scale — a plain B-tree
index doesn't help substring search, and 50,000 rows of sequential
scan on every keystroke is exactly what Step 7's "never filter large
datasets on client" rule is trying to prevent on the *server* side too.

### `companies`
Straightforward. `unique(college_id, name)` — the same recruiter can
exist as a distinct row per college relationship, which is realistic
(the same company may have a different HR contact or terms per campus).

### `drives`
References both `company_id` and `college_id` (denormalized, §1).
`allowed_branches text[]` rather than a join table — branch eligibility
for a drive is a small, static list per drive, not a relationship that
needs its own referential integrity.

### `applications`
`unique(student_id, drive_id)` — exactly the duplicate-prevention the
prompt calls for. `college_id` denormalized from either side for RLS
speed.

### `rounds`
`unique(drive_id, sequence_number)` — two rounds can't claim the same
position in one drive's pipeline.

### `evaluations`
`unique(round_id, student_id)` — one evaluation record per student per
round (re-evaluation is an update, not a new row).

### `placements`
Deliberately **not** unique per student — a student can have multiple
placement records over their season (e.g. one offer declined, another
accepted). `drive_id` is nullable since a placement could in principle
be recorded without a full drive pipeline behind it (an off-cycle or
manually-recorded offer).

### `notifications`
Simple, `college_id`-scoped, `target_role` enum including `all`.

## 3. Indexing strategy

Every foreign key gets an index (Postgres doesn't create these
automatically). Every column mentioned in the prompt's required search
list (`branch`, `cgpa`, `placement_status`, `graduation_year`, `email`,
`roll_number`) gets a composite index led by `college_id`, since every
real query is scoped to one tenant — an index on `branch` alone would
be far less selective than `(college_id, branch)` once multiple
colleges share the database.

Composite indexes actually created:
```
students:     (college_id, branch), (college_id, placement_status),
              (college_id, cgpa), (college_id, graduation_year),
              (college_id, email) [also the unique constraint],
              GIN(full_name) via pg_trgm
companies:    (college_id, industry)
drives:       (college_id, status), (college_id, drive_date),
              (registration_end) [for "closing soon" queries]
applications: (college_id, status), (drive_id, status)
rounds:       (drive_id)
evaluations:  (round_id), (student_id)
placements:   (student_id), (company_id), (college_id)
notifications:(college_id, created_at desc)
```

## 4. Query patterns this schema is built for

- **Student search/list** (paginated, filtered by any combination of
  branch/CGPA/placement status/graduation year, text search on
  name/roll/email): a single indexed query, `LIMIT`/`OFFSET` or keyset
  pagination, never a full-table client-side filter.
- **Drive pipeline view** (a drive + its rounds + application counts
  per round): one query per level, not N+1 — rounds and applications
  are fetched by `drive_id` in batched queries, not looped per row.
- **Student profile view** (one student + their applications +
  evaluations + placement, if any): fetched as parallel queries keyed
  by `student_id`, combined server-side into one response — satisfying
  the "one request, everything needed" API rule from a Server
  Component, without needing a hand-rolled REST aggregation endpoint.
- **Dashboard counts** (students by branch, drives by status, etc.):
  candidates for `unstable_cache()` — see `/docs/caching-strategy.md`.

## 5. What's built vs. deferred in this pass

Built to full depth: `students` (schema, RLS, CSV import, search,
audit logging, UI). Schema + RLS + basic CRUD server actions only,
**no dashboard UI yet**: `companies`, `drives`, `applications`,
`rounds`, `evaluations`, `placements`, `notifications`. Building full
UI for all 8 modules in one pass would mean shallow, unverified work
across all of them rather than one module done properly — the students
module is the one with real reference data to validate against, so
it's the one built end-to-end first.
