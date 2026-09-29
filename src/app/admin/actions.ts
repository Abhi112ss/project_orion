/*src/app/admin/actions.ts*/

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";
import { logAudit } from "@/lib/audit/log";
import {
  provisionStaffSchema,
  updateStaffSchema,
  featureFlagKeySchema,
} from "@/lib/validation/schemas";
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

/**
 * Creates a staff account end-to-end: a Supabase Auth user (via the
 * service-role client, since only that can create users directly) and
 * the matching profiles row — never through the student self-service
 * RLS path.
 */
export async function provisionStaff(input: {
  email: string;
  fullName: string;
  role: Extract<Role, "tpo" | "coordinator" | "company_hr">;
  collegeId: string;
}) {
  const bundle = await requireRole(["super_admin"]);

  const parsed = provisionStaffSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }
  const { email, fullName, role, collegeId } = parsed.data;

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
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
    email,
    full_name: fullName || null,
    role,
    college_id: collegeId,
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
    metadata: { email, role, collegeId },
  });

  return { success: true as const };
}

/**
 * Changes an existing staff member's role and/or college. Uses the
 * service-role client since regular RLS has no update policy for
 * profiles at all — every profile change beyond self-registration is
 * an explicit admin action, never implicit.
 */
export async function updateStaffMember(
  profileId: string,
  updates: { role: string; collegeId: string }
) {
  const bundle = await requireRole(["super_admin"]);

  const parsed = updateStaffSchema.safeParse(updates);
  if (!parsed.success) {
    return {
      success: false as const,
      message: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const admin = createAdminClient();

  const { data: before } = await admin
    .from("profiles")
    .select("role, college_id")
    .eq("id", profileId)
    .maybeSingle();

  const { error } = await admin
    .from("profiles")
    .update({ role: parsed.data.role, college_id: parsed.data.collegeId })
    .eq("id", profileId);

  if (error) {
    return { success: false as const, message: error.message };
  }

  await logAudit({
    actorId: bundle.userId,
    actorEmail: bundle.email,
    action: "role_changed",
    targetType: "profile",
    targetId: profileId,
    metadata: { before, after: parsed.data },
  });

  return { success: true as const };
}

/**
 * Toggles a staff (or student) account's active status. This is the
 * enable/disable half of staff lifecycle management — is_active is
 * already checked by getSessionBundle(), so a disabled account is
 * locked out immediately on their next request, no session
 * invalidation logic needed separately.
 */
export async function setStaffActive(profileId: string, isActive: boolean) {
  const bundle = await requireRole(["super_admin"]);
  const admin = createAdminClient();

  const { error } = await admin.from("profiles").update({ is_active: isActive }).eq("id", profileId);

  if (error) {
    return { success: false as const, message: error.message };
  }

  await logAudit({
    actorId: bundle.userId,
    actorEmail: bundle.email,
    action: isActive ? "user_enabled" : "user_disabled",
    targetType: "profile",
    targetId: profileId,
  });

  return { success: true as const };
}

/**
 * Toggles a feature flag. Separate mechanism from setMaintenanceMode —
 * see the note in migration 007 for why these aren't unified.
 */
export async function setFeatureFlag(key: string, enabled: boolean) {
  const bundle = await requireRole(["super_admin"]);

  const parsedKey = featureFlagKeySchema.safeParse(key);
  if (!parsedKey.success) {
    return { success: false as const, message: "Unknown feature flag." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled, updated_by: bundle.userId, updated_at: new Date().toISOString() })
    .eq("key", parsedKey.data);

  if (error) {
    return { success: false as const, message: error.message };
  }

  await logAudit({
    actorId: bundle.userId,
    actorEmail: bundle.email,
    action: "feature_flag_changed",
    targetType: "feature_flag",
    targetId: parsedKey.data,
    metadata: { enabled },
  });

  return { success: true as const };
}