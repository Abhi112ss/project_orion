/*src/lib/auth/provision-student.ts*/
import { createClient } from "@/lib/supabase/server";

// Kept intentionally small and student-only. Staff roles are never
// granted through this path — see profiles RLS policy in schema.sql,
// which enforces role = 'student' at the database level too.
const STUDENT_DEFAULT_PERMISSIONS = ["view_drives", "apply_to_drives", "manage_own_profile"];

/**
 * Pure — no I/O — so it's directly unit-testable without mocking
 * Supabase. Extracted out of findCollegeIdByEmailDomain for that
 * reason.
 */
export function extractDomain(email: string): string | null {
  const domain = email.trim().toLowerCase().split("@")[1];
  return domain || null;
}

/**
 * Looks up whether a college has registered this email's domain for
 * student self-registration. Returns the college id, or null if the
 * domain isn't recognized (self-registration stays closed for it).
 */
export async function findCollegeIdByEmailDomain(email: string): Promise<string | null> {
  const domain = extractDomain(email);
  if (!domain) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("college_domains")
    .select("college_id")
    .eq("domain", domain)
    .maybeSingle();

  if (error) {
    console.error("findCollegeIdByEmailDomain query failed:", error.code, error.message, {
      domain,
    });
    return null;
  }

  if (!data) {
    console.error("findCollegeIdByEmailDomain: no match for domain", domain);
    return null;
  }

  return data.college_id;
}

/**
 * Creates a student profile for the currently authenticated user.
 * Only ever inserts role: "student" — this function has no parameter
 * for role, on purpose, so it can't be misused to grant a different
 * one. The database's RLS policy double-checks this independently.
 */
export async function provisionStudentProfile(
  userId: string,
  email: string,
  collegeId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    email,
    role: "student",
    college_id: collegeId,
    permissions: STUDENT_DEFAULT_PERMISSIONS,
    is_active: true,
  });

  if (error) {
    console.error("provisionStudentProfile failed:", error.code, error.message, {
      userId,
      email,
      collegeId,
    });
  }

  return !error;
}