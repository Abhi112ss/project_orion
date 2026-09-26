import { SignOutButton } from "@/components/sign-out-button";
import type { SessionBundle } from "@/lib/auth/types";

export function DashboardShell({
  title,
  bundle,
  children,
}: {
  title: string;
  bundle: SessionBundle;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#030712] px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#F9FAFB]">{title}</h1>
            <p className="mt-1 text-sm text-[#9CA3AF]">
              Signed in as {bundle.email} · {bundle.role}
            </p>
          </div>
          <SignOutButton />
        </div>

        <div className="mt-8 rounded-xl border border-white/10 bg-[#111827]/60 p-6">
          {children ?? (
            <p className="text-sm text-[#9CA3AF]">
              This dashboard is a placeholder — features come next.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}