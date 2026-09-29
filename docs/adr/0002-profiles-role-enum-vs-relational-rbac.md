# ADR 0002: Single `role` enum + `permissions text[]`, not a relational RBAC

## Status
Accepted — revisit if per-user permission grants become common

## Context
A later audit prompt assumed a fully relational RBAC schema:
`users`, `roles`, `permissions`, `role_permissions` (many-to-many).
ORION instead has one `profiles` table with a `role` enum
(`tpo | coordinator | company_hr | student | super_admin`) and a
`permissions text[]` column on the same row.

## Decision
Keep the enum + array model for Phase 1. It satisfies the spec's
"1 request, 2 max" SessionBundle budget trivially (it's one row), and
every authorization check so far ("is this a TPO", "is this
super_admin") is role-level, not fine-grained-permission-level.

## Consequences
- Cheaper to query (no joins) and to reason about.
- Coarser: two users with the same role cannot currently have different
  permission sets baked into policy logic — `permissions` exists on the
  schema but nothing yet reads it to gate behavior.
- If Phase 2 needs per-user permission grants that vary within a role
  (e.g. one TPO can approve drives, another can't), this should be
  revisited in favor of a real `role_permissions` join table. That is a
  breaking schema change, not a patch — plan a dedicated migration if
  the need arises rather than bolting it on incrementally.
