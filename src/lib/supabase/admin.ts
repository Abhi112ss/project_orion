import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client for trusted, server-only operations: writing
 * audit log entries and admin-side user provisioning. This bypasses
 * RLS entirely.
 *
 * NEVER import this into a Client Component, and never let
 * SUPABASE_SERVICE_ROLE_KEY reach the browser — it belongs only in
 * server-only files (Server Actions, Route Handlers).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}