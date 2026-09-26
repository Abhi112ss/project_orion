import { getSessionBundle } from "@/lib/auth/get-session-bundle";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function CoordinatorPage() {
  const bundle = (await getSessionBundle())!;
  return <DashboardShell title="Coordinator Dashboard" bundle={bundle} />;
}