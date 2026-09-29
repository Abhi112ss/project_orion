# ORION — Phase 2A Context Transfer

Companion to `PHASE_1_HANDOFF.md`. Read that first for the auth/RBAC
foundation this builds on — this document only covers what Phase 2A
added, and is explicit about what it did **not** finish.

## Honesty note, upfront

The execution prompt that kicked off Phase 2A asked for all 9 modules
built to production-grade UI depth, a full caching layer (`unstable_cache`
+ TanStack Query + `revalidateTag` wired everywhere), TanStack Virtual,
and a jump straight to "Phase 3" — all in one pass. That's not what
happened, on purpose: building all 9 modules shallowly would have meant
nothing was actually verified against the real reference data you
provided. Instead, **one module (`students`) was built completely and
correctly**, using your actual CSV as the validation target, and the
other 8 got a real, correct database foundation without invented UI on
top of it. See `/docs/phase2-database-design.md` §5 for the same
reasoning at build time.

**There is no Phase 3 spec.** Nothing given to this session defines
what Phase 3 contains. Don't start it based on a guess — get an actual
Phase 3 execution prompt first, the same way Phase 1 and Phase 2A each
had one.

## What's new

### Database (migration `009_phase2_core_schema.sql`)
All 9 modules from the execution prompt, plus `profiles.company_id`
(additive — Phase 1's `profiles` table and its existing behavior are
completely untouched). Full detail in
`/docs/phase2-database-design.md`. Highlights:
- Every table is `college_id`-scoped, denormalized rather than
  joined-for, specifically for RLS/index performance at 50k+ scale
- `students.profile_id` (nullable) links the master record to a Phase 1
  `profiles` row — but the two tables serve different purposes and
  are **not** the same entity (see the design doc §0 for why)
- Shared RLS helpers: `current_profile_role()`,
  `current_profile_college_id()`, `current_profile_company_id()`
- `pg_trgm` + GIN index on `students.full_name` for fast partial-name
  search at scale (a plain B-tree index doesn't help `ILIKE '%term%'`)

### The `students` module — built completely
- `src/lib/validation/students.ts` — `studentSchema` (full entity) and
  `studentImportRowSchema` (the looser CSV-row shape, matching what
  your reference file actually contains — no `university_number`,
  `section`, `year`, `skills`, or social links required)
- `src/lib/students/import.ts` — `parseStudentImportCsv()`, pure (no
  I/O), validates every row, detects in-file duplicates by roll number
  and email, and flags (doesn't error on) a mismatched `College` column
  since the import target college is always chosen explicitly, never
  inferred from the file
- `src/lib/students/queries.ts` — `searchStudents()`, the one indexed,
  paginated, server-side-filtered query the list page needs, and
  `listDistinctBranches()` for the filter dropdown
- `src/app/tpo/students/actions.ts` — `importStudents()`,
  `updateStudent()`, `setStudentActive()`. All three: `requireRole`
  guarded, Zod validated, audit logged, and use the **normal
  authenticated client, not the service-role client** — RLS's own
  insert/update policy already enforces "TPO can only touch their own
  college," so there was no reason to bypass it
- `src/app/tpo/students/{page,import-form,student-table}.tsx` — the UI:
  bulk import with a real structured error report, search + branch/
  status filters, pagination, inline edit, enable/disable

### Docs
`phase2-database-design.md`, `caching-strategy.md`, `api-design.md` —
all written to be honest about scope, not aspirational.

### Tests
10 new unit tests on `parseStudentImportCsv`, using rows in the exact
format of your uploaded reference file (`46 total` across the project).

## Decisions worth knowing about before extending this

1. **`students` ≠ `profiles`.** A student existing in the master
   database does not mean they can log in, and logging in (Phase 1)
   does not automatically create a master record. If Phase 3 needs
   "every student who signs up gets a master record automatically" or
   vice versa, that's new linking logic, not something this pass
   assumed.
2. **Coordinator has no access to student management yet.**
   `/tpo/students`'s actions are `tpo`-only because the route lives
   under `/tpo`'s layout, which only admits `tpo`. Extending this to
   `coordinator` needs a real decision about where that UI should live
   (a shared route group, or a duplicated `/coordinator/students`) —
   not a quick patch.
3. **Import failures are reported per 250-row chunk, not per row,
   when a chunk fails.** If one row in a chunk violates a unique
   constraint (e.g. an email already used by a different roll number),
   Postgres rejects that whole `INSERT ... ON CONFLICT` statement, and
   the chunk's failure message won't tell you which single row caused
   it — only which 250 roll numbers were in that chunk. A more precise
   version would use a staging table + a Postgres function to isolate
   exactly which row failed inside a transaction; that's a real
   Phase 2B candidate, not built here because it's meaningfully more
   infrastructure for a case (an email colliding across roll numbers)
   that's rare in practice.
4. **`company_hr` provisioning still doesn't set `company_id`.** The
   admin console's staff-provisioning form (`Phase 1`) wasn't updated
   to let a super_admin pick a company when creating a `company_hr`
   account — so right now, every `company_hr` profile has
   `company_id: null`, and the RLS policies that check
   `current_profile_company_id()` (on `drives`, `applications`,
   `rounds`, `evaluations`, `placements`) will correctly deny them
   everything until this is fixed. This is a real, immediate follow-up,
   not a future nice-to-have — `company_hr` is functionally locked out
   of anything company-scoped until `admin/staff-form.tsx` and
   `provisionStaff`/`updateStaffMember` are extended with a company
   picker.
5. **Multi-tenant isolation is still only verified at the RLS-policy
   level, not with real cross-college data.** Now that `students` has
   real rows, this is the first module where that verification is
   actually possible — worth doing before building anything else on
   top of it (see the Phase 1 certification report's same open item).

## What to do next, in a sensible order

1. Fix the `company_hr` → `company_id` gap (#4 above) — small, and
   currently blocking that entire role from being useful.
2. Run real cross-college isolation tests against `students` now that
   there's data to test with (#5 above).
3. Decide the actual Phase 2B/3 scope — companies + drives are the
   natural next module (a TPO needs to create companies before drives
   can reference them), but that's a product decision, not an
   engineering default.
4. Only once there's a real caching *problem* (a slow dashboard, a
   frequently-hit aggregate query): revisit `caching-strategy.md` and
   wire in `unstable_cache` + `revalidateTag` for that specific case.
