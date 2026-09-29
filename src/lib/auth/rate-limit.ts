/*src/lib/auth/rate-limit.ts*/
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

/**
 * True if this email has already racked up MAX_ATTEMPTS failed OTP
 * verifications within the last WINDOW_MINUTES. Checked before calling
 * Supabase's verifyOtp, so a locked-out email doesn't even get to try
 * another guess.
 */
export async function isOtpRateLimited(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();

  const { count, error } = await admin
    .from("otp_verify_attempts")
    .select("*", { count: "exact", head: true })
    .eq("email", email)
    .gte("attempted_at", windowStart);

  if (error) {
    // Fail open on the counter query itself (a broken rate limiter
    // shouldn't be the reason legitimate logins break), but log it —
    // this should never actually happen in normal operation.
    console.error("isOtpRateLimited query failed:", error.code, error.message);
    return false;
  }

  return (count ?? 0) >= MAX_ATTEMPTS;
}

/**
 * Records one failed verification attempt. Only call this on a wrong
 * or expired code — successful verifications don't count toward the
 * lockout.
 */
export async function recordOtpAttempt(email: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("otp_verify_attempts").insert({ email });

  if (error) {
    console.error("recordOtpAttempt failed:", error.code, error.message);
  }
}