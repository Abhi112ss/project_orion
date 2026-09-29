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

## Explicitly deferred (not Phase 1 scope)

- Real dashboard features (drives, applications, recruiter CRM,
  interview scheduling, analytics, AI features)
- Relational `role_permissions` RBAC (ADR 0002) — current enum+array
  model is intentional for now
- Automated route-level integration/e2e tests against a live deployment
  (requires a running environment this session doesn't have access to
  — see the certification report for the manual procedure instead)
