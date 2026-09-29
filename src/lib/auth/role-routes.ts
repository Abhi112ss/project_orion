/*src/lib/auth/role-routes.ts*/
import type { Role } from "@/lib/auth/types";

const ROLE_HOME: Record<Role, string> = {
  tpo: "/tpo",
  coordinator: "/coordinator",
  company_hr: "/company-hr",
  student: "/student",
  super_admin: "/admin",
};

export function roleHome(role: Role): string {
  return ROLE_HOME[role];
}

/**
 * Does this user's role satisfy a section that requires one of
 * `allowedRoles`? super_admin always satisfies every check — it's the
 * one role meant to see across every dashboard.
 */
export function canAccessRole(userRole: Role, allowedRoles: Role[]): boolean {
  return userRole === "super_admin" || allowedRoles.includes(userRole);
}