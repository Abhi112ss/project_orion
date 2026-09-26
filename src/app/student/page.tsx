import { getSessionBundle } from "@/lib/auth/get-session-bundle";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function StudentPage() {
  const bundle = (await getSessionBundle())!;
  return <DashboardShell title="Student Dashboard" bundle={bundle} />;
}