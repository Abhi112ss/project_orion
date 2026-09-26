"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";
import { logAudit } from "@/lib/audit/log";
import type { Role } from "@/lib/auth/types";

/**
 * Flips the platform-wide kill switch. Guarded twice: once by the
 * /admin layout, and again here inside the action itself — a server
 * action can in principle be invoked directly, so it must not trust
 * that the layout already checked.
 */
export async function setMaintenanceMode(enabled: boolean) {
  const bundle = await requireRole(["super_admin"]);
  const supabase = await createClient();

  const { error } = await supabase
    .from("platform_settings")
    .update({
      maintenance_mode: enabled,
      updated_by: bundle.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) {
    console.error("setMaintenanceMode failed:", error.code, error.message);
    return { success: false as const, message: "Couldn't update the setting. Try again." };
  }

  await logAudit({
    actorId: bundle.userId,
    actorEmail: bundle.email,
    action: enabled ? "maintenance_enabled" : "maintenance_disabled",
  });

  return { success: true as const };
}

type StaffRole = Extract<Role, "tpo" | "coordinator" | "company_hr">;

/**
 * Creates a staff account end-to-end: a Supabase Auth user (via the
 * service-role client, since only that can create users directly) and
 * the matching profiles row — never through the student self-service
 * RLS path. This is the "admin console" replacement for the manual
 * SQL inserts used earlier.
 */
export async function provisionStaff(input: {
  email: string;
  fullName: string;
  role: StaffRole;
  collegeId: string;
}) {
  const bundle = await requireRole(["super_admin"]);
  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: input.email,
    email_confirm: true,
  });

  if (createError || !created?.user) {
    // Most common cause: this email already has a Supabase Auth user
    // (e.g. from an earlier sign-in attempt that got denied). There's
    // no reliable, version-stable "find user by email" call to fall
    // back on here, so this is surfaced rather than guessed at.
    return {
      success: false as const,
      message: `Couldn't create the auth user${
        createError ? `: ${createError.message}` : ""
      }. If this email already exists under Authentication → Users, copy its UID and insert the profile row manually for now.`,
    };
  }

  const userId = created.user.id;

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    email: input.email,
    full_name: input.fullName || null,
    role: input.role,
    college_id: input.collegeId,
    permissions: [],
    is_active: true,
  });

  if (profileError) {
    return {
      success: false as const,
      message: `Auth user was created, but the profile insert failed: ${profileError.message}`,
    };
  }

  await logAudit({
    actorId: bundle.userId,
    actorEmail: bundle.email,
    action: "staff_provisioned",
    targetType: "profile",
    targetId: userId,
    metadata: { email: input.email, role: input.role, collegeId: input.collegeId },
  });

  return { success: true as const };
}