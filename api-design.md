# API Design

## There is no separate REST API layer, by design

ORION's Phase 1 and Phase 2 both use Next.js **Server Actions** (and
plain async functions called directly from Server Components for reads)
as the interface between UI and database — the same pattern
`signInWithGoogle`, `provisionStaff`, and now `importStudents` /
`updateStudent` / `setStudentActive` all follow. There's no
`/api/students` REST route, and none is planned unless something
outside this Next.js app needs to call in (a mobile app, a third-party
integration) — at which point a proper versioned REST or RPC layer
would be designed for that specific need, not built speculatively now.

This isn't a shortcut: it's the more modern, and for this app's shape,
better-fitting choice. A Server Component fetches exactly what its page
needs, in-process, with full type safety end to end — no request
serialization, no separate API contract to keep in sync with two
different route handlers, no risk of the client and server drifting on
what a "student" object looks like.

## The "one request, everything needed" rule, applied

The execution prompt's example — 4 requests (student, branch, status,
CGPA) vs. 1 (student profile) — maps directly onto how every read in
this app already works:

- `searchStudents()` returns every column the list table displays in
  one query. There is no follow-up per-row fetch for branch or status.
- A hypothetical future "student detail" view (student + their
  applications + evaluations + placement) would fetch all of those in
  parallel via `Promise.all` inside one Server Component, and return
  one fully-assembled page — not four round trips from the client. This
  is the same pattern the admin console's page already uses (5 parallel
  queries via `Promise.all`, not sequential fetches) and should be
  followed for every future dashboard page.

## Mutations: Server Actions, always validated, always audited

Every mutation in this app (Phase 1 and Phase 2A alike) follows the
same shape:
1. `requireRole([...])` — is this caller even allowed to be here.
2. A Zod schema — is the input actually shaped like what it claims.
3. The database write, through RLS (not a bypass), unless the action is
   inherently privileged (staff provisioning, audit writes) and uses
   the service-role client for that specific reason.
4. `logAudit(...)` — every mutation leaves a record.

`importStudents`, `updateStudent`, and `setStudentActive` in
`src/app/tpo/students/actions.ts` are the reference implementation of
this shape for Phase 2A — any new mutation (companies, drives,
applications, etc.) should follow the identical structure rather than
inventing a new pattern.

## What's NOT built as an "API" yet

Companies, drives, applications, rounds, evaluations, placements, and
notifications have schema + RLS (migration 009) but no Server Actions
yet. When each is built, it follows the four-step shape above — this
doc doesn't need to be re-written per module, just followed.
