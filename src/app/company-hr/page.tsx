import { getSessionBundle } from "@/lib/auth/get-session-bundle";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function CompanyHrPage() {
  const bundle = (await getSessionBundle())!;
  return <DashboardShell title="Company HR Dashboard" bundle={bundle} />;
}