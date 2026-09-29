# ORION — Progress Log

Chronological record of what's been built. See `/docs/adr/` for the
reasoning behind non-obvious decisions, and
`/docs/phase1-certification.md` for the current overall status.

## Phase 1: Authentication, RBAC, Admin Console

- [x] Login page UI (4 role tabs, dark theme, no password field)
- [x] Google OAuth (Supabase Auth) + `/auth/callback` handler
- [x] Email OTP send/verify, code-based (not magic link)
- [x] `SessionBundle` (`getSessionBundle`) — single query, `is_active`
      + role checked, wrapped in `React.cache()` for per-request reuse
- [x] `requireRole()` guard, used by every protected layout
- [x] Middleware: redirects unauthenticated visits away from protected
      routes; kill-switch check runs before that
- [x] Multi-college schema: `colleges` + `college_domains`
      (many-domains-per-college), seeded with the Malla Reddy Group
- [x] Domain-gated student self-registration (see ADR 0004)
- [x] `super_admin` role, bypasses all role checks (see ADR 0003)
- [x] Audit logging (`audit_logs`, service-role-only writes,
      super_admin-only reads) — covers login success/denial, OTP
      sent/failed, self-registration, staff provisioning, role changes,
      enable/disable, feature flag changes, maintenance toggles, sign-out
- [x] Kill switch (`platform_settings.maintenance_mode`), super_admin
      bypass, public `/maintenance` page
- [x] Four dashboard shells (`/tpo /coordinator /company-hr /student`)
      — identity + sign-out only, no real features yet
- [x] Admin console (`/admin`): dashboard links, staff provisioning,
      staff list with inline edit/enable/disable, feature flags panel,
      kill switch toggle, recent-activity feed
- [x] Feature flags (`FEATURE_EMAILS`, `FEATURE_AI`, `FEATURE_ANALYTICS`)
      — database-controlled, super_admin-only writes, audited
- [x] OTP brute-force rate limiting (`otp_verify_attempts`)
- [x] Zod validation on every server action input
- [x] Unit test suite (36 tests: role routing, validation schemas,
      domain extraction) — see `/docs/phase1-certification.md` for what
      is and isn't covered by automated tests

## Phase 2A: Student Master Data Platform

- [x] `/docs/phase2-database-design.md` — full design doc, written
      before any SQL, covering all 9 modules
- [x] Full schema for all 9 modules (`students`, `companies`, `drives`,
      `applications`, `rounds`, `evaluations`, `placements`,
      `notifications`, plus `profiles.company_id`) — indexes, RLS,
      multi-tenant `college_id` scoping on every table, shared
      `current_profile_role()`/`current_profile_college_id()`/
      `current_profile_company_id()` helper functions
- [x] `students` module built end-to-end: Zod validation (entity +
      CSV import row), pure CSV parser with duplicate detection and a
      structured error/warning report, chunked upsert import (not
      service-role — goes through RLS like everything else), inline
      edit, enable/disable, server-side search/filter/pagination,
      audit logging (one entry per import batch, not per row)
- [x] `/tpo/students` page: bulk import UI with a real error report,
      search + branch/status filters, paginated table
- [x] `/docs/caching-strategy.md`, `/docs/api-design.md` — both honest
      about what's implemented (nothing cached yet — deliberate, see
      the doc) vs. what's a real Server Actions pattern already in use
- [x] 46 unit tests total (10 new, on the CSV import parser using the
      actual reference file's row format)
- [ ] `companies`, `drives`, `applications`, `rounds`, `evaluations`,
      `placements`, `notifications` — schema + RLS only. No Server
      Actions, no UI. This is the honest state, not a gap glossed over
      — see `AI_CONTEXT_TRANSFER_PHASE2A.md`.
- [ ] No caching layer, no TanStack Query, no virtualization — all
      deliberately deferred with reasons in `caching-strategy.md`
- [ ] No Phase 3 spec exists yet — nothing in this session defines one

## Explicitly deferred from Phase 1 (not in scope then, still not built)

- Real dashboard features (drives, applications, recruiter CRM,
  interview scheduling, analytics, AI features) — Phase 2A begins this
  with `students`, see above
- Relational `role_permissions` RBAC (ADR 0002) — current enum+array
  model is intentional for now
- Automated route-level integration/e2e tests against a live deployment
  (requires a running environment this session doesn't have access to
  — see the certification report for the manual procedure instead)
