/*src/lib/auth/require-role.ts*/
import { redirect } from "next/navigation";
import { getSessionBundle } from "@/lib/auth/get-session-bundle";
import { canAccessRole } from "@/lib/auth/role-routes";
import type { Role, SessionBundle } from "@/lib/auth/types";

/**
 * Drop this at the top of any role-scoped layout (e.g. app/tpo/layout.tsx):
 *
 *   const bundle = await requireRole(["tpo"]);
 *
 * No session -> /login. Session but wrong role -> /login?error=no_access.
 * super_admin always passes, regardless of which roles are listed.
 */
export async function requireRole(allowedRoles: Role[]): Promise<SessionBundle> {
  const bundle = await getSessionBundle();

  if (!bundle) {
    redirect("/login");
  }

  if (!canAccessRole(bundle.role, allowedRoles)) {
    redirect("/login?error=no_access");
  }

  return bundle;
}