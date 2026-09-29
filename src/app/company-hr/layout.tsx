/*src/app/company-hr/layout.tsx*/
import { requireRole } from "@/lib/auth/require-role";

export default async function CompanyHrLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["company_hr"]);
  return <>{children}</>;
}