# ORION — PHASE 2A IMPROVEMENTS & FIXES

Before continuing with Phase 2 development, implement and validate the following improvements.

---

# 1. SUPER_ADMIN GLOBAL ACCESS

## Current Issue

Super Admin currently receives:

```text
This account has no college assigned, so there's no student list to show.
```

because the student list page assumes every user is college-scoped.

This is incorrect.

---

## Required Behavior

### Super Admin

Must have unrestricted visibility across all colleges.

Capabilities:

- View all colleges
- View all TPOs
- View all Coordinators
- View all HRs
- View all Students
- View all Drives
- View all Applications
- View all Placements

---

### Example Workflow

```text
Super Admin
    ↓
College Directory
    ↓
Select MRCET
    ↓
View MRCET Data
```

or

```text
Super Admin
    ↓
Select MRGI
    ↓
View MRGI Data
```

---

### Implementation

Do not bypass security.

Implement explicit Super Admin logic.

Example:

```ts
if (role === "super_admin") {
  // global access
} else {
  // college-scoped access
}
```

---

# 2. STUDENT MASTER DATABASE IMPORT ORDERING

## Current Issue

CSV import successfully inserts records but ordering becomes inconsistent.

Imported students appear jumbled.

This creates confusion for TPOs.

---

## Required Behavior

Student records should always appear in roll-number order.

---

## Roll Number Rules

Examples:

```text
22N31A0577
22N31A05A4
22N31A05B2
22N31A4532
22N31A5562
22N31A6572
23N31A25A3
```

Roll numbers are fixed-length institutional identifiers.

---

## Sorting Strategy

Use:

```text
Simple Lexicographical Sorting
```

because:

- Fixed length
- Consistent format
- Fast
- Native DB support

---

### Database

Default ordering:

```sql
ORDER BY roll_number ASC
```

---

### UI

Student tables should load:

```sql
ORDER BY roll_number ASC
```

unless the user explicitly changes sorting.

---

### Import Pipeline

After CSV import:

- Store records
- Re-fetch ordered results
- Display ordered table

Never display raw insertion order.

---

# 3. STUDENT MASTER DATABASE MANAGEMENT

TPO must have full control over uploaded student data.

---

## Required Features

### Upload

Support:

```text
CSV
Excel (.xlsx)
```

---

### Delete Import

Allow TPO to:

```text
Delete Selected Students

Delete Batch Import

Delete Entire Dataset
```

with confirmation modal.

---

### Bulk Operations

Future-ready structure:

```text
Bulk Update

Bulk Archive

Bulk Delete
```

---

# 4. STUDENT TABLE PERFORMANCE

Student table must remain fast even for:

```text
500 Students
5000 Students
50000 Students
```

---

## Mandatory

### Pagination

Never load entire dataset.

Use:

```sql
LIMIT
OFFSET
```

or cursor pagination.

---

### Search

Server-side only.

Support:

```text
Name
Roll Number
Email
Branch
CGPA
Placement Status
```

---

### Indexes

Ensure:

```sql
roll_number
email
branch
placement_status
college_id
```

are indexed.

---

# 5. LOADING EXPERIENCE

Remove blank-screen loading states.

---

## Skeleton Loading

Create:

```text
StudentTableSkeleton
CompanyTableSkeleton
DriveTableSkeleton
DashboardSkeleton
```

Use:

```tsx
loading.tsx;
```

for every major route.

---

## Do Not Use

```text
Large Spinners
White Screens
Blocking UI
```

---

# 6. CACHE STRATEGY

Prevent unnecessary requests.

---

## Student List

Use:

```text
TanStack Query
```

with:

```ts
staleTime;
cacheTime;
```

configured appropriately.

---

## Dashboard Stats

Use:

```ts
unstable_cache();
```

or

```ts
revalidateTag();
```

where appropriate.

---

## Goal

Prevent:

```text
Duplicate Fetches
Repeated Requests
Waterfall Requests
```

---

# 7. FIX FAILING TESTS

Current Status:

```text
48 Tests
45 Passing
3 Failing
```

Failing:

### provisionStaffSchema

- accepts a valid tpo payload
- allows fullName to be omitted

### updateStaffSchema

- accepts a valid role/college pair

---

## Required Action

Investigate root cause.

Do not modify tests to make them pass.

Verify:

### provisionStaffSchema

Expected:

```ts
{
  email: "x@y.com",
  fullName: "X",
  role: "tpo",
  collegeId: VALID_UUID
}
```

should pass.

---

Expected:

```ts
{
  email: "x@y.com",
  role: "tpo",
  collegeId: VALID_UUID
}
```

should pass.

---

### updateStaffSchema

Expected:

```ts
{
  role: "coordinator",
  collegeId: VALID_UUID
}
```

should pass.

---

Determine whether:

- schema changed
- tests outdated
- enum mismatch
- UUID validation issue
- role validation issue

Fix the actual problem.

---

# 8. VITEST CONFIG WARNING

Current Warning:

```text
__dirname is unsupported by configLoader: native
```

---

## Required Fix

Replace:

```ts
__dirname;
```

with:

```ts
import.meta.dirname;
```

inside:

```text
vitest.config.ts
```

to ensure future compatibility.

---

# SUCCESS CRITERIA

Before continuing Phase 2:

✓ Super Admin can access all college data

✓ Student imports remain correctly ordered

✓ Student management supports deletion

✓ Pagination implemented

✓ Search implemented

✓ Skeleton loading implemented

✓ Cache strategy applied

✓ All tests pass

✓ Vitest warning resolved

Only after all items are verified may development continue.
