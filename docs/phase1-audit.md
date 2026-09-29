# Phase 1 Audit

Audited against both the original Phase 1 auth spec and the later
20-step certification checklist. Where the checklist assumed
infrastructure that doesn't exist (a relational `role_permissions`
schema, a live deployment, a CI pipeline), that's called out explicitly
rather than silently skipped or falsely claimed.

## Completed

- Google OAuth + Email OTP, no password auth anywhere (spec requirement)
- `SessionBundle` via `getSessionBundle()` — single query, wrapped in
  `React.cache()` so a layout guard and its page share one DB read
- `requireRole()` guard, applied to all five protected sections
  (`/tpo /coordinator /company-hr /student /admin`)
- Middleware: blocks unauthenticated access to protected routes;
  kill-switch check runs before that
- Multi-college schema (`colleges` + `college_domains`), seeded with
  6 real institutions + 1 flagged dev-only entry
- Domain-gated student self-registration, hardcoded to `role: student`
  at both the application layer and the database RLS layer
  independently
- `super_admin` role, bypasses all role checks (equivalent to the
  checklist's `PLATFORM_OWNER` — see ADR 0003 for the naming decision)
- Audit logging: `login_success`, `login_denied`, `otp_sent`,
  `otp_verify_failed`, `student_self_registered`, `staff_provisioned`,
  `role_changed`, `user_enabled`, `user_disabled`,
  `feature_flag_changed`, `maintenance_enabled/disabled`, `sign_out` —
  written via a service-role client with no client-side insert policy,
  so the log can't be forged by anything but a database-level compromise
- Kill switch (`platform_settings.maintenance_mode`), super_admin
  bypass, public `/maintenance` page
- Staff management: create (was already done), **edit role/college,
  enable/disable, list** (added this pass) — closes the checklist's
  "Staff Management Completion" step for TPO/Coordinator/Company HR
  uniformly
- Feature flags (`FEATURE_EMAILS`, `FEATURE_AI`, `FEATURE_ANALYTICS`) —
  database-controlled, super_admin-only writes, audited
- OTP brute-force rate limiting (5 attempts / 15 min per email)
- Zod validation on every server action's input (email, OTP code, staff
  role, college UUID, feature flag key)
- 36 unit tests (Vitest) covering role routing, validation schemas, and
  domain extraction — see "Testing Status" in the certification report
  for scope honesty
- No `any` or `@ts-ignore` found anywhere in the code generated across
  this project's auth/RBAC work

## Partially Complete

- **Multi-tenant isolation** ("TPO A cannot access College B"): the
  schema (`profiles.college_id`, `college_domains`) and the pattern
  (RLS scoped to `auth.uid()`'s own row) are in place, but **no
  dashboard queries any college-scoped data yet** — the four dashboards
  are identity-only placeholders. This means the isolation guarantee is
  currently untested under real conditions, not because it's broken,
  but because there's no cross-college data access code yet for it to
  guard. This must be re-verified the moment the first real
  college-scoped table/query is added in Phase 2.
- **Route security**: every protected layout has a `requireRole()`
  guard, which is the correct mechanism — but this has only been
  exercised manually during development (per this conversation's
  history), never against a scripted test hitting live URLs. See the
  manual test procedure in the certification report.
- **RBAC action matrix** ("allowed actions / denied actions" per role):
  defined at the route level (which dashboard a role can enter), not at
  the action level, because there are no actions yet within any
  dashboard beyond viewing it. `permissions text[]` exists on `profiles`
  but nothing currently reads it to gate a specific action — it's
  provisioned but unused.

## Missing

- **Relational `role_permissions` RBAC** — deliberately not built; see
  ADR 0002. The checklist assumed this schema; the actual schema is a
  `role` enum + `permissions` array on `profiles`. This is a design
  decision, not an oversight — but it means anything that assumed the
  relational shape (e.g. a `role_permissions` table to seed/verify)
  doesn't apply here.
- **`sendEmailOtp` failures aren't rate-limited**, only `verifyEmailOtp`
  is. Supabase's own send-side throttling was relied on for that half
  (and was in fact hit once during development testing).
- **No account recovery / session revocation UI** beyond
  enable/disable — disabling an account blocks their *next* request
  (via `getSessionBundle`'s `is_active` check) but doesn't invalidate an
  already-issued Supabase session token directly; the practical effect
  is the same (locked out on next page load) but this distinction is
  worth knowing.
- **No automated route-level or E2E tests** — see "Testing Status" in
  the certification report.

## Security Concerns

- **`SUPABASE_SERVICE_ROLE_KEY` handling**: correctly kept server-only
  in every file it's used in (`lib/supabase/admin.ts`,
  `app/admin/actions.ts`, `app/login/actions.ts` for rate limiting) —
  but this depends on the deployment environment never leaking it via
  a misconfigured `NEXT_PUBLIC_` prefix or client bundle. **Cannot be
  verified from here** — check your actual `.env` files and build
  output before deploying.
- **`gmail.com` is registered as a self-registration domain for dev
  testing** (see the "Development / Testing" college). This is a real,
  live security relaxation as long as it exists: any Gmail account can
  currently self-register as a student. It must be deleted before
  production — this is the single most important action item in this
  report.
- **Staff re-provisioning gap**: if `provisionStaff` fails because the
  email already has a Supabase Auth user (e.g. from an earlier denied
  attempt), the fallback is manual UID lookup + direct SQL. Not a
  vulnerability, but an operational gap worth closing before this
  console sees real use.

## Performance Concerns

- **Middleware runs a `platform_settings` query on every single
  request**, plus a second `profiles` query only when maintenance mode
  is active and a user is signed in. Acceptable at current scale; the
  first thing to optimize if traffic grows (e.g. cache the flag in a
  short-lived cookie or edge config).
- No N+1 patterns found — `getSessionBundle`'s single-row select plus
  `React.cache()` deduplication across a layout+page pair was
  specifically designed to avoid this, and the admin page's five
  independent queries are correctly run in parallel via `Promise.all`,
  not sequentially.

## Recommended Fixes

1. Delete the `gmail.com` / "Development / Testing" college row before
   any production deployment (highest priority item in this report).
2. Add rate limiting to `sendEmailOtp` as well, even though Supabase's
   own limit currently covers it — defense in depth, and Supabase's
   limit is account-wide, not per-address.
3. Before adding the first real college-scoped table in Phase 2,
   re-verify multi-tenant isolation with actual cross-college test data
   — the "Partially Complete" note above.
4. Consolidate `supabase/schema.sql` into one fully current file (it
   currently reflects the state after migration 002 only; migrations
   003–008 are not folded in) — a cleanup task, not a blocker.
5. Decide explicitly whether `permissions text[]` on `profiles` is
   staying as a real gating mechanism or should be removed if it's not
   going to be used — an unused security-relevant column is worth a
   deliberate decision either way, not just an accumulating no-op.
