/*src/lib/audit/log.ts*/
import { createAdminClient } from "@/lib/supabase/admin";

export type AuditAction =
  | "login_success"
  | "login_denied"
  | "otp_sent"
  | "otp_verify_failed"
  | "student_self_registered"
  | "staff_provisioned"
  | "role_changed"
  | "user_disabled"
  | "user_enabled"
  | "feature_flag_changed"
  | "maintenance_enabled"
  | "maintenance_disabled"
  | "sign_out"
  // Phase 2A — student master data
  | "students_imported"
  | "student_updated"
  | "student_disabled"
  | "student_enabled"
  // Phase 2A — other modules (schema-level for now; wired in as each
  // module's server actions are built)
  | "company_created"
  | "company_updated"
  | "drive_created"
  | "drive_updated"
  | "application_status_changed"
  | "evaluation_recorded"
  | "placement_recorded"
  | "notification_sent";

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