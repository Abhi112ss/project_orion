# Changelog

All notable changes to ORION, in build order.

## Phase 2A — Student Master Data Platform

### Added
- Full database schema for all 9 Phase 2 modules: `students`,
  `companies`, `drives`, `applications`, `rounds`, `evaluations`,
  `placements`, `notifications` — every table multi-tenant-scoped via
  `college_id`, fully indexed, fully RLS-protected
- `profiles.company_id` — additive extension so `company_hr` accounts
  can be scoped to the company they represent
- Shared RLS helper functions: `current_profile_role()`,
  `current_profile_college_id()`, `current_profile_company_id()`
- `students` module end-to-end: CSV bulk import (validation, duplicate
  detection, per-row error report, chunked upsert), server-side
  search/filter/pagination, inline edit, enable/disable
- `/tpo/students` page
- `docs/phase2-database-design.md`, `docs/caching-strategy.md`,
  `docs/api-design.md`
- Audit actions: `students_imported`, `student_updated`,
  `student_disabled`, `student_enabled`, plus placeholders for the
  other 7 modules' future mutations
- 10 new unit tests (CSV import parser, using the real reference file's
  row format) — 46 total

### Known limitations (see AI_CONTEXT_TRANSFER_PHASE2A.md)
- 7 of 9 modules have schema + RLS only, no Server Actions or UI yet
- No caching layer implemented (deliberately deferred, see
  `caching-strategy.md`)
- Chunked import failures are reported per-chunk (250 rows), not
  per-row, for a failing batch

## Unreleased — Phase 1 hardening pass

### Added
- `feature_flags` table + admin panel (`FEATURE_EMAILS`, `FEATURE_AI`,
  `FEATURE_ANALYTICS`)
- Staff management: edit role/college, enable/disable, list — all staff
  roles, from the admin console
- `otp_verify_attempts` table + `lib/auth/rate-limit.ts` — brute-force
  protection on OTP verification (5 attempts / 15 min)
- Zod schemas (`lib/validation/schemas.ts`) validating every server
  action's input: email, OTP code, staff role, college UUID, feature
  flag key
- Audit actions: `otp_sent`, `role_changed`, `user_disabled`,
  `user_enabled`, `feature_flag_changed`
- Unit test suite (Vitest): 36 tests across role routing, validation
  schemas, and domain extraction
- `docs/adr/0001`–`0005`, `docs/progress.md`,
  `docs/phase1-audit.md`, `docs/phase1-certification.md`

### Changed
- `extractDomain()` extracted as a pure, independently testable
  function out of `findCollegeIdByEmailDomain`
- Email normalization (trim + lowercase) now centralized in
  `emailSchema` rather than duplicated per call site

## Earlier — Phase 1 core build

### Added
- Login page (4 role tabs, split-card dark-theme layout)
- Google OAuth + Email OTP via Supabase Auth
- `SessionBundle` / `getSessionBundle()` / `requireRole()`
- `colleges` + `college_domains` schema, seeded with the Malla Reddy
  Group of institutions
- Domain-gated student self-registration
- `super_admin` role
- `audit_logs` table + `logAudit()` helper
- `platform_settings` kill switch + `/maintenance` page
- Four dashboard shells (`/tpo /coordinator /company-hr /student`)
- Admin console (`/admin`) with staff provisioning
