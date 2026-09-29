/*src/lib/auth/get-session-bundle.ts*/
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { SessionBundle } from "@/lib/auth/types";

/**
 * Authorization gate for the whole app: authentication alone (a
 * verified Google/OTP identity) does not grant access. This fetches
 * the profile row that proves the email exists in ORION's database,
 * is active, and has a role — all in the one request the Phase 1
 * spec calls for — and returns the SessionBundle callers should
 * cache for the rest of the session.
 *
 * Wrapped in React's cache() so a layout, its page, and anything else
 * that calls this within the same request all share one DB read
 * instead of each firing their own — this is what makes it cheap to
 * call requireRole() in a layout AND read the bundle again in the
 * page for display data.
 *
 * Returns null for: no session, no matching profile, a deactivated
 * account, or a profile with no role. Callers treat all of these as
 * "not authorized" and should not try to distinguish between them
 * for the user (that distinction belongs in server-side logs, not
 * the login UI).
 */
export const getSessionBundle = cache(async (): Promise<SessionBundle | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, college_id, permissions, is_active")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("getSessionBundle: profile query failed:", error.code, error.message, {
      userId: user.id,
    });
    return null;
  }

  if (!profile) {
    console.error("getSessionBundle: no profile row for", user.id, user.email);
    return null;
  }

  if (!profile.is_active) {
    console.error("getSessionBundle: profile is inactive for", user.id);
    return null;
  }

  if (!profile.role) {
    console.error("getSessionBundle: profile has no role for", user.id);
    return null;
  }

  return {
    userId: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    collegeId: profile.college_id,
    permissions: profile.permissions ?? [],
  };
});