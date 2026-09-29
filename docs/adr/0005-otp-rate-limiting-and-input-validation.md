# ADR 0005: App-level OTP rate limiting + Zod validation at every action boundary

## Status
Accepted

## Context
Supabase's own rate limiting throttles how often a code can be *sent*
to an address, but does not separately throttle how many *guesses*
can be made against an already-sent 6-digit code (1,000,000
combinations — brute-forceable without a limiter). Separately, all
server actions previously trusted their string arguments as-is.

## Decision
- `otp_verify_attempts` table + `lib/auth/rate-limit.ts`: after 5 failed
  verification attempts for an email within 15 minutes, further
  attempts are rejected before Supabase is even asked to check the
  code. Successful verifications don't count toward the limit.
- Every server action that takes user input now validates it through a
  Zod schema in `lib/validation/schemas.ts` before doing anything else
  — email format/normalization, OTP code shape, staff role enum,
  UUID college IDs, feature flag keys.

## Consequences
- The rate limit table (`otp_verify_attempts`) is written only by the
  service-role client — no RLS policy exists for regular clients at
  all, since a limiter regular clients could read or clear defeats its
  purpose.
- Email normalization (trim + lowercase) now happens once, in the
  schema, rather than being re-implemented ad hoc in each function
  (this fixed a latent inconsistency between `provision-student.ts`'s
  own trim/lowercase and other call sites that didn't normalize).
