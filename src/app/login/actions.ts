"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionBundle } from "@/lib/auth/get-session-bundle";
import { roleHome } from "@/lib/auth/role-routes";
import { findCollegeIdByEmailDomain, provisionStudentProfile } from "@/lib/auth/provision-student";
import { logAudit } from "@/lib/audit/log";
import type { Role } from "@/lib/auth/types";

/**
 * Kicks off the Google OAuth flow. `intendedRole` is only ever used to
 * decide whether the callback should attempt student self-provisioning
 * — it carries no authority on its own, and staff roles ignore it
 * entirely (their profile must already exist).
 */
export async function signInWithGoogle(redirectTo?: string, intendedRole?: Role) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = new URL("/auth/callback", origin ?? undefined);
  if (redirectTo) callbackUrl.searchParams.set("redirectTo", redirectTo);
  if (intendedRole === "student") callbackUrl.searchParams.set("intent", "student");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callbackUrl.toString() },
  });

  if (error || !data.url) {
    redirect("/login?error=google_oauth_failed");
  }

  redirect(data.url);
}

/**
 * Sends a one-time code. For staff roles this behaves exactly as
 * before: shouldCreateUser is false, so the email must already be a
 * provisioned Supabase user. For the student role, self-registration
 * is allowed, but only when the email's domain matches a college that
 * has registered it — everything else still gets no account.
 */
export async function sendEmailOtp(email: string, intendedRole: Role) {
  const supabase = await createClient();

  let shouldCreateUser = false;

  if (intendedRole === "student") {
    const collegeId = await findCollegeIdByEmailDomain(email);
    if (!collegeId) {
      return {
        success: false as const,
        message: "Your college isn't set up for student self-registration yet. Contact your TPO.",
      };
    }
    shouldCreateUser = true;
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser },
  });

  if (error) {
    console.error("sendEmailOtp failed:", error.status, error.message);
    return {
      success: false as const,
      message: "Couldn't send a code to that address. Check it and try again.",
    };
  }

  return { success: true as const };
}

/**
 * Verifies the OTP. If no SessionBundle exists yet (no profile row)
 * and the intended role was "student", attempts the domain-gated
 * self-provisioning path before deciding access is denied. Staff
 * roles never hit the provisioning branch, regardless of what a
 * client sends — a missing staff profile is always "no access".
 * Every terminal outcome (success, denial, self-registration) is
 * recorded to the audit log.
 */
export async function verifyEmailOtp(
  email: string,
  token: string,
  redirectTo?: string,
  intendedRole?: Role
) {
  const supabase = await createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });

  if (error) {
    await logAudit({
      actorEmail: email,
      action: "otp_verify_failed",
      metadata: { intendedRole },
    });
    return {
      success: false as const,
      message: "That code didn't match or has expired.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let bundle = await getSessionBundle();
  let selfRegistered = false;

  if (!bundle && intendedRole === "student") {
    const collegeId = await findCollegeIdByEmailDomain(email);
    if (!collegeId) {
      console.error("verifyEmailOtp: no college matched domain for", email);
    } else if (!user) {
      console.error("verifyEmailOtp: no authenticated user after verifyOtp for", email);
    } else {
      const provisioned = await provisionStudentProfile(user.id, email, collegeId);
      if (provisioned) {
        selfRegistered = true;
        bundle = await getSessionBundle();
        if (!bundle) {
          console.error(
            "verifyEmailOtp: profile insert reported success but getSessionBundle still returned null for",
            email
          );
        }
      }
    }
  }

  if (!bundle) {
    await logAudit({
      actorId: user?.id ?? null,
      actorEmail: email,
      action: "login_denied",
      metadata: { method: "otp", intendedRole },
    });
    await supabase.auth.signOut();
    redirect("/login?error=no_access");
  }

  if (selfRegistered) {
    await logAudit({
      actorId: bundle.userId,
      actorEmail: bundle.email,
      action: "student_self_registered",
      targetType: "profile",
      targetId: bundle.userId,
      metadata: { collegeId: bundle.collegeId },
    });
  }

  await logAudit({
    actorId: bundle.userId,
    actorEmail: bundle.email,
    action: "login_success",
    metadata: { method: "otp", role: bundle.role },
  });

  redirect(redirectTo ?? roleHome(bundle.role));
}