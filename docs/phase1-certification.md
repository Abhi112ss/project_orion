# ORION Phase 1 Certification

## Completed Requirements

- Google OAuth + Email OTP authentication, no passwords
- SessionBundle, single-query, cached per-request
- Role-based route protection on all 5 sections (`requireRole` +
  middleware)
- Domain-gated student self-registration
- `super_admin` bypass role
- Audit logging (12 distinct action types, service-role-only writes)
- Kill switch with super_admin bypass
- Feature flags (3 flags, database-controlled, audited)
- Staff management: create, edit, enable/disable, list
- OTP brute-force rate limiting
- Zod validation on every server action input
- 36 unit tests
- ADRs, progress log, changelog, this audit + certification report

## Security Status

**Conditional Pass.**

What's solid: no passwords anywhere, RLS enforced independently of
application code on every sensitive table, service-role key confined to
server-only files, audit log cannot be forged by any client role, OTP
brute-force protected.

What blocks an unconditional pass: the `gmail.com` dev-testing domain is
currently live and lets any Gmail account self-register as a student.
**This must be removed before production** (see the audit report's
Recommended Fix #1). Until it's removed, this is a real open door, not
a theoretical one.

## Performance Status

**Pass**, with one noted tradeoff. `getSessionBundle` is cached
per-request and is the only DB read most page loads need. Middleware
adds one unconditional `platform_settings` read per request for the
kill switch — an accepted, documented tradeoff (see audit report), not
an oversight.

## Testing Status

**Partial Pass — scope is honest, not inflated.**

36 automated unit tests exist and genuinely pass, covering:
- `roleHome` / `canAccessRole` (role routing logic)
- Every Zod schema (email, OTP code, staff provisioning, staff update,
  feature flag keys)
- `extractDomain` (pure domain-parsing logic)

What is **not** covered by automated tests, and why:
- **Login flows end-to-end** (OTP send/verify, Google OAuth callback) —
  these require a live Supabase project and cannot be meaningfully
  mocked without testing mocks instead of real behavior. Manual
  procedure below.
- **RLS policy enforcement** — requires a real Postgres instance;
  Supabase doesn't provide a lightweight local RLS test harness that
  this session has access to. Manual procedure below.
- **Route protection under real HTTP requests** — requires a running
  Next.js server and real browser sessions. Manual procedure below.

### Manual verification procedure (run this yourself before certifying further)

1. **Login success/failure**: sign in as an existing TPO via Google →
   lands on `/tpo`. Sign in with an email that has no profile → lands on
   `/login?error=no_access`. Both should appear in `/admin`'s "Recent
   activity" as `login_success` / `login_denied`.
2. **Disabled account**: disable a staff account from `/admin`, then try
   to load their dashboard in their own browser session (or sign out and
   back in as them) — should redirect to `/login`, not show stale
   content.
3. **Wrong role, blocked**: sign in as a Coordinator, manually navigate
   to `/tpo` — should redirect to `/login?error=no_access`.
4. **OTP rate limit**: enter 6 wrong codes in a row for one email within
   15 minutes — the 6th attempt should be rejected with the rate-limit
   message before Supabase is even asked.
5. **Kill switch**: enable it from `/admin`, open an incognito window,
   try any URL — redirected to `/maintenance`. Your super_admin session
   should be unaffected.
6. **Cross-college isolation** (⚠️ **currently not applicable** — no
   dashboard queries college-scoped data yet; this test becomes
   meaningful only after the first real Phase 2 feature is built. Do
   not skip re-running this once that happens.)

## Documentation Status

**Pass.** `/docs/adr/0001`–`0005`, `/docs/progress.md`,
`/CHANGELOG.md`, `/docs/phase1-audit.md`, this file — all created and
reflect the actual implementation, including its deliberate deviations
from the original certification checklist's assumed schema (see ADR
0002 and 0003).

## Production Readiness

**Blocked**, on exactly two items:

1. Remove the `gmail.com` dev-testing domain (SQL, one statement — see
   the audit report).
2. Confirm `SUPABASE_SERVICE_ROLE_KEY` is not exposed anywhere in your
   actual deployment config (this session cannot see your real
   environment to check this for you).

Everything else in this report is either passing or an intentionally
scoped-down decision with a documented reason (ADRs 0001–0005). Neither
blocker requires new code — both are configuration/data changes you can
make in minutes.

## Remaining Issues

- `gmail.com` dev-testing domain still present (blocks production —
  see above)
- No automated route-level/E2E test coverage (manual procedure
  documented above as the interim substitute)
- `permissions text[]` column exists but nothing reads it yet — decide
  whether to build against it or drop it before it accumulates as dead
  schema
- `supabase/schema.sql` reflects an earlier state; migrations 003–008
  are not folded into it (cosmetic — the migrations themselves are the
  source of truth, but a consolidated file would help future fresh
  installs)
- Staff re-provisioning when an email already has an orphaned Supabase
  Auth user is a manual fallback, not a built flow

## Recommendation

**Phase 2 Approved — Conditional.**

Every requirement that can be verified from within this session passes,
or is a documented, deliberate deviation with a stated reason (not a
gap papered over). The two items blocking an unconditional pass are
both fast, concrete, and entirely in your hands to close in the next
few minutes (delete one seed row; check one env var in your actual
deployment). Nothing else needs to happen before you start Phase 2 work
— but the manual verification procedure above should be run at least
once against your real, running environment before you consider Phase 1
truly closed, since no claim in this report about live request/response
behavior has been (or could be) verified by this session directly.

```
ORION FOUNDATION v1.0
PHASE 1 COMPLETE (pending the 2 items above)
PHASE 2 APPROVED — CONDITIONAL
```
