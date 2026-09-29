# Caching Strategy

## What's actually implemented in this pass

**Nothing yet uses `unstable_cache()` or React Query.** The student list
page (`/tpo/students`) is a plain Server Component reading `searchParams`
and querying directly — no caching layer at all. This is a deliberate
sequencing choice, not an oversight: caching a query is only worth doing
once the query itself is correct and its access pattern is known, and
this is the first real query this schema has ever served. Caching it
now would be caching an assumption.

## What genuinely doesn't need a caching layer yet

Server Components + URL-driven `searchParams` (what the student list
page uses) already gets you server-side filtering, no client-side
over-fetching, and no duplicate requests — the three things Step 6/7
of the execution prompt actually care about. React Query's value is
background refetch, optimistic updates, and client-side cache
deduplication across multiple components reading the same data
simultaneously — none of which apply yet, because there's exactly one
page reading student data. Introducing it now would be infrastructure
for a problem that doesn't exist yet.

**Per-route code splitting** (Step 6's "split Admin/TPO/Coordinator/HR/
Student independently") is already free — Next.js App Router creates a
separate bundle per route segment automatically. `/tpo/students`
already doesn't ship any code for `/coordinator` or `/admin`. Nothing
needed to be built for this.

## What's a real candidate, when the need shows up

- **`unstable_cache()`** for the dashboard-summary-style aggregates this
  prompt anticipated (student counts by branch, drive counts by status)
  — once those dashboards exist. Tag them by `college_id` so
  `revalidateTag(`college:${collegeId}`)` after any mutation (an
  import, a status change) invalidates exactly one college's cached
  numbers, not the whole cache.
- **TanStack Query**, if/when a page needs client-side interactivity on
  top of server data that outlives a single request — e.g. a live
  drive-pipeline board where recruiters and TPOs are looking at the
  same data simultaneously and want it to update without a manual
  refresh.
- **TanStack Virtual**, only once a table is actually rendering
  thousands of DOM rows at once. The student list never does this — it
  paginates at 25/page specifically so virtualization is never needed
  for it. If a future view (e.g. "all applications for a drive") needs
  to show more rows than pagination makes sense for, that's where
  virtualization belongs.

## The one caching decision already made

`revalidateTag`/`revalidatePath` aren't wired in because nothing is
cached yet to invalidate. When `unstable_cache()` is introduced (first
candidate: a TPO dashboard summary), every mutation that could change
its inputs — `importStudents`, `updateStudent`, `setStudentActive` —
needs a matching `revalidateTag()` call added at that time. This is
listed here so it isn't forgotten when that page gets built.
