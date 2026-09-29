/*src/lib/auth/types.ts*/
export type Role = "tpo" | "coordinator" | "company_hr" | "student" | "super_admin";

/**
 * Created once at login, reused everywhere — never re-fetch role,
 * permissions, college, or profile separately on subsequent page loads.
 */
export type SessionBundle = {
  userId: string;
  email: string;
  fullName: string | null;
  role: Role;
  collegeId: string | null;
  permissions: string[];
};