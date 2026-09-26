import { requireRole } from "@/lib/auth/require-role";

export default async function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["coordinator"]);
  return <>{children}</>;
}