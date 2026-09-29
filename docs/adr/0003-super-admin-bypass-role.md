# ADR 0003: `super_admin` role (equivalent to "Platform Owner")

## Status
Accepted

## Context
Development needed one account that could access all four role
dashboards without juggling four separate logins, and the product
direction also calls for a future platform-wide admin console with a
kill switch.

## Decision
Added a 5th enum value, `super_admin`, to `orion_role`. It bypasses
every role check via `canAccessRole()` / `requireRole()` — no allow-list
of roles excludes it. One account (`abhiramreddy350@gmail.com`) is
currently provisioned this way, with `college_id: null` since it isn't
scoped to one institution.

Naming note: a later spec used the term `PLATFORM_OWNER` for this same
concept. The enum value stays `super_admin` — renaming it would be a
breaking migration for a naming difference only, with no functional
benefit. Treat "Platform Owner" and `super_admin` as the same role when
reading other documents.

## Consequences
- Every future role-scoped table/policy must remember: `super_admin`
  passes automatically. Any new RLS policy that hand-rolls a role check
  instead of going through the shared helper risks accidentally
  excluding super_admin (or, worse, being copy-pasted without the
  bypass and creating an inconsistent experience).
- Currently only one super_admin account exists, created manually via
  migration. No self-service or admin-console way to create a second
  one yet — that would need to be a deliberate, carefully-audited
  addition (creating a super_admin is a materially different action
  from creating staff).
