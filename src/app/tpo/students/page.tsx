/*src/app/tpo/students/page.tsx*/
import { getSessionBundle } from "@/lib/auth/get-session-bundle";
import { searchStudents, listDistinctBranches } from "@/lib/students/queries";
import { StudentTable } from "@/app/tpo/students/student-table";
import { StudentImportForm } from "@/app/tpo/students/import-form";

const PLACEMENT_STATUSES = ["not_placed", "placed", "opted_out", "not_eligible"];

type SearchParams = { q?: string; branch?: string; status?: string; page?: string };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const bundle = (await getSessionBundle())!;

  // super_admin has no fixed college_id. A college-picker for
  // super_admin to browse any college's students is a reasonable
  // follow-up, not built in this pass — this page currently assumes a
  // real tpo account scoped to one college.
  if (!bundle.collegeId) {
    return (
      <main className="min-h-screen bg-[#030712] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-[#9CA3AF]">
            This account has no college assigned, so there&apos;s no student list to show. This
            page currently requires a college-scoped TPO account.
          </p>
        </div>
      </main>
    );
  }

  const page = Number(params.page ?? "1") || 1;

  const [result, branches] = await Promise.all([
    searchStudents({
      collegeId: bundle.collegeId,
      q: params.q,
      branch: params.branch,
      placementStatus: params.status,
      page,
      pageSize: 25,
    }),
    listDistinctBranches(bundle.collegeId),
  ]);

  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize));

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[#F9FAFB]">
          Student Master Database
        </h1>
        <p className="mt-1 text-sm text-[#9CA3AF]">{result.totalCount} students on file.</p>

        <div className="mt-6 rounded-xl border border-white/10 bg-[#111827]/40 p-5">
          <h2 className="text-sm font-medium text-[#F9FAFB]">Bulk import</h2>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            CSV with a header row: Roll Number, Full Name, Email, Phone, College, Branch,
            Department, Academic Year, CGPA, Backlogs, Active.
          </p>
          <div className="mt-3">
            <StudentImportForm />
          </div>
        </div>

        <form className="mt-6 flex flex-wrap gap-2" action="/tpo/students" method="get">
          <input
            type="text"
            name="q"
            defaultValue={params.q}
            placeholder="Search name, roll number, or email"
            className="min-w-[220px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#F9FAFB] outline-none placeholder:text-[#6B7280]"
          />
          <select
            name="branch"
            defaultValue={params.branch ?? ""}
            className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-sm text-[#F9FAFB]"
          >
            <option value="">All branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={params.status ?? ""}
            className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-sm text-[#F9FAFB]"
          >
            <option value="">Any placement status</option>
            {PLACEMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[#00FF88] px-4 py-2 text-sm font-semibold text-[#030712]"
          >
            Search
          </button>
        </form>

        <div className="mt-4">
          <StudentTable rows={result.rows} />
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center gap-3 text-xs text-[#9CA3AF]">
            <span>
              Page {result.page} of {totalPages}
            </span>
            <div className="flex gap-1">
              {result.page > 1 && (
                <a
                  href={buildPageHref(params, result.page - 1)}
                  className="rounded-md border border-white/10 px-2 py-1 hover:text-[#F9FAFB]"
                >
                  Previous
                </a>
              )}
              {result.page < totalPages && (
                <a
                  href={buildPageHref(params, result.page + 1)}
                  className="rounded-md border border-white/10 px-2 py-1 hover:text-[#F9FAFB]"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function buildPageHref(params: SearchParams, page: number): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.branch) sp.set("branch", params.branch);
  if (params.status) sp.set("status", params.status);
  sp.set("page", String(page));
  return `/tpo/students?${sp.toString()}`;
}