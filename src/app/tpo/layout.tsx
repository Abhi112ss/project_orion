/*src/app/tpo/layout.tsx*/
import { requireRole } from "@/lib/auth/require-role";

export default async function TpoLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["tpo"]);
  return <>{children}</>;
}