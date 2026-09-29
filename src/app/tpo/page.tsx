/*src/app/tpo/page.tsx*/
import Link from "next/link";
import { getSessionBundle } from "@/lib/auth/get-session-bundle";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function TpoPage() {
  // Non-null: the layout above already redirected away if there's no
  // valid tpo (or super_admin) session. cache() means this is a
  // free re-read, not a second DB round trip.
  const bundle = (await getSessionBundle())!;
  return (
    <DashboardShell title="TPO Dashboard" bundle={bundle}>
      <Link
        href="/tpo/students"
        className="inline-block rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-[#F9FAFB] transition-colors hover:border-[#00FF88]/40"
      >
        Student Master Database →
      </Link>
    </DashboardShell>
  );
}