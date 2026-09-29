# ADR 0001: Google OAuth + Email OTP only, no passwords

## Status
Accepted

## Context
The Phase 1 spec mandated that ORION never implement username/password
authentication, password storage, or password reset flows — identity
verification is delegated entirely to trusted providers.

## Decision
Login supports exactly two methods: Google OAuth (via Supabase Auth) and
Email OTP (6-digit code, via Supabase Auth). No password field exists
anywhere in the UI or schema.

## Consequences
- No password-reset UX to build or secure.
- Users without a Google account still have a path in (Email OTP).
- Brute-force risk shifts to guessing a 6-digit OTP rather than a
  password — mitigated by `otp_verify_attempts` rate limiting
  (see ADR 0005, migration 008).
