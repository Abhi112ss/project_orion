/*src/lib/students/queries.ts*/
import { createClient } from "@/lib/supabase/server";

export type StudentSearchParams = {
  collegeId: string;
  q?: string;
  branch?: string;
  placementStatus?: string;
  page?: number;
  pageSize?: number;
};

export type StudentRow = {
  id: string;
  roll_number: string;
  full_name: string;
  email: string;
  branch: string;
  department: string | null;
  cgpa: number | null;
  backlogs: number;
  graduation_year: number | null;
  placement_status: string;
  is_active: boolean;
};

export type StudentSearchResult = {
  rows: StudentRow[];
  totalCount: number;
  page: number;
  pageSize: number;
};

// PostgREST's .or() filter string breaks on unescaped commas/parens in
// the search term — strip them rather than trying to escape PostgREST's
// filter grammar inside a user-supplied string.
function sanitizeSearchTerm(term: string): string {
  return term.replace(/[(),]/g, "").trim();
}

/**
 * The one query the student list page needs. Always scoped to one
 * college, always paginated, always server-side filtered — this is
 * the query the (college_id, branch) / (college_id, placement_status)
 * / (college_id, cgpa) indexes and the full_name GIN trigram index
 * exist for for.
 */
export async function searchStudents(params: StudentSearchParams): Promise<StudentSearchResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select("id, roll_number, full_name, email, branch, department, cgpa, backlogs, graduation_year, placement_status, is_active", {
      count: "exact",
    })
    .eq("college_id", params.collegeId);

  if (params.q) {
    const term = sanitizeSearchTerm(params.q);
    if (term) {
      query = query.or(`full_name.ilike.%${term}%,roll_number.ilike.%${term}%,email.ilike.%${term}%`);
    }
  }

  if (params.branch) {
    query = query.eq("branch", params.branch);
  }

  if (params.placementStatus) {
    query = query.eq("placement_status", params.placementStatus);
  }

  query = query.order("full_name", { ascending: true }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error("searchStudents failed:", error.code, error.message);
    return { rows: [], totalCount: 0, page, pageSize };
  }

  return { rows: data ?? [], totalCount: count ?? 0, page, pageSize };
}

/**
 * Distinct branch values for the filter dropdown — cheap enough to run
 * per page load at current scale (one indexed scan), but a candidate
 * for unstable_cache() if this college's branch list is large or the
 * page gets hit very frequently. See docs/caching-strategy.md.
 */
export async function listDistinctBranches(collegeId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("branch")
    .eq("college_id", collegeId)
    .order("branch");

  if (error || !data) return [];
  return Array.from(new Set(data.map((r) => r.branch)));
}