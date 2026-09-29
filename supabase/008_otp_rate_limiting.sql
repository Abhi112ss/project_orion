/*supabase/008_otp_rate_limiting.sql*/

-- Tracks failed OTP verification attempts, for brute-force protection.
-- Supabase's own rate limit already throttles how often a code can be
-- *sent*; this closes the separate gap of someone spamming guesses at
-- an already-sent 6-digit code.
create table public.otp_verify_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  attempted_at timestamptz not null default now()
);

create index otp_verify_attempts_email_idx on public.otp_verify_attempts (email, attempted_at desc);

alter table public.otp_verify_attempts enable row level security;

-- No policies at all, intentionally. Only the service-role client
-- (lib/supabase/admin.ts) reads or writes this table — a rate limiter
-- that regular clients could read or clear isn't a rate limiter.