import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "login_success"
  | "login_denied"
  | "otp_verify_failed"
  | "student_self_registered"
  | "staff_provisioned"
  | "maintenance_enabled"
  | "maintenance_disabled"
  | "sign_out";

/**
 * Fire-and-forget audit write. Failures are logged to the server
 * console but never thrown — a broken audit write should never be
 * the reason a login or an admin action fails outright.
 */
export async function logAudit(params: {
  actorId?: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminClient();

  const { error } = await admin.from("audit_logs").insert({
    actor_id: params.actorId ?? null,
    actor_email: params.actorEmail ?? null,
    action: params.action,
    target_type: params.targetType ?? null,
    target_id: params.targetId ?? null,
    metadata: params.metadata ?? {},
  });

  if (error) {
    console.error("logAudit failed:", error.code, error.message, params);
  }
}