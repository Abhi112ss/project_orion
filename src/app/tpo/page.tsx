import { getSessionBundle } from "@/lib/auth/get-session-bundle";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function TpoPage() {
  // Non-null: the layout above already redirected away if there's no
  // valid tpo (or super_admin) session. cache() means this is a
  // free re-read, not a second DB round trip.
  const bundle = (await getSessionBundle())!;
  return <DashboardShell title="TPO Dashboard" bundle={bundle} />;
}