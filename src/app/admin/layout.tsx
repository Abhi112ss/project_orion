/*src/app/admin/layout.tsx*/

import { requireRole } from "@/lib/auth/require-role";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["super_admin"]);
  return <>{children}</>;
}