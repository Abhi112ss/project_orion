# ADR 0004: Domain-gated student self-registration

## Status
Accepted

## Context
TPO/Coordinator/Company HR accounts must never be self-service (a
random person typing an email should never gain administrative access
to a college's placement data). Students are the highest-volume,
lowest-privilege role, and many campus platforms let students
self-register using an institutional email.

## Decision
- `colleges` (one row per institution) and `college_domains` (many
  domains per college, since some institutions have more than one) hold
  the list of domains eligible for self-registration.
- `sendEmailOtp` / `signInWithGoogle` only ever request account creation
  (`shouldCreateUser: true`, or the Google equivalent) when the intended
  role is `student` AND the email's domain is registered.
- `provisionStudentProfile()` hardcodes `role: "student"` — it has no
  parameter for role, so it cannot be misused to grant anything else.
- The database's RLS INSERT policy on `profiles` independently enforces
  the same rule (self-uid, role = student, domain match) — a bug in the
  application code cannot grant more than the database allows.

## Consequences
- Any Gmail-style personal email can never self-register unless its
  domain is explicitly added to `college_domains` — this is why the
  `gmail.com` dev-testing entry is flagged for removal before launch
  (see the certification report).
- Onboarding a new institution to ORION requires adding its domain(s)
  to `college_domains` before its students can self-register — a
  deliberate manual step, not automatic.
