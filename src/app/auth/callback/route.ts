import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionBundle } from "@/lib/auth/get-session-bundle";
import { roleHome } from "@/lib/auth/role-routes";
import { findCollegeIdByEmailDomain, provisionStudentProfile } from "@/lib/auth/provision-student";
import { logAudit } from "@/lib/audit/log";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("redirectTo");
  const intent = searchParams.get("intent");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let bundle = await getSessionBundle();
      let selfRegistered = false;

      // Same domain-gated self-provisioning as the OTP path, only for
      // an explicit student intent and only when the verified Google
      // email's domain matches a registered college.
      if (!bundle && intent === "student" && user?.email) {
        const collegeId = await findCollegeIdByEmailDomain(user.email);
        if (collegeId) {
          const provisioned = await provisionStudentProfile(user.id, user.email, collegeId);
          if (provisioned) {
            selfRegistered = true;
            bundle = await getSessionBundle();
          }
        }
      }

      if (!bundle) {
        await logAudit({
          actorId: user?.id ?? null,
          actorEmail: user?.email ?? null,
          action: "login_denied",
          metadata: { method: "google", intent },
        });
        // Verified identity, but no matching (active) ORION account,
        // and not eligible for student self-provisioning.
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=no_access`);
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
        metadata: { method: "google", role: bundle.role },
      });

      const destination = redirectTo ?? roleHome(bundle.role);
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}