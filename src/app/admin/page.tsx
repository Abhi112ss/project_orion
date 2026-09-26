import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getSessionBundle } from "@/lib/auth/get-session-bundle";
import { KillSwitchToggle } from "@/app/admin/kill-switch-toggle";
import { StaffProvisionForm } from "@/app/admin/staff-form";

const DASHBOARDS = [
  { href: "/tpo", label: "TPO" },
  { href: "/coordinator", label: "Coordinator" },
  { href: "/company-hr", label: "Company HR" },
  { href: "/student", label: "Student" },
];

export default async function AdminPage() {
  const supabase = await createClient();
  const bundle = (await getSessionBundle())!;

  const [{ data: colleges }, { data: settings }, { data: recentActivity }] = await Promise.all([
    supabase.from("colleges").select("id, name").order("name"),
    supabase.from("platform_settings").select("maintenance_mode").eq("id", true).maybeSingle(),
    supabase
      .from("audit_logs")
      .select("action, actor_email, target_type, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <main className="min-h-screen bg-[#030712] px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-[#F9FAFB]">
          Super admin console
        </h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">
          Signed in as {bundle.email}. Full access across every role.
        </p>

        <section className="mt-8">
          <h2 className="text-sm font-medium text-[#F9FAFB]">Dashboards</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {DASHBOARDS.map((d) => (
              <Link
                key={d.href}
                href={d.href}
                className="rounded-xl border border-white/10 bg-[#111827]/60 px-5 py-4 text-sm font-medium text-[#F9FAFB] transition-colors hover:border-[#00FF88]/40"
              >
                {d.label} dashboard →
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-[#111827]/40 p-5">
          <h2 className="text-sm font-medium text-[#F9FAFB]">Add staff account</h2>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Creates the Supabase Auth user and the ORION profile in one step.
          </p>
          <div className="mt-4">
            <StaffProvisionForm colleges={colleges ?? []} />
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-[#111827]/40 p-5">
          <h2 className="text-sm font-medium text-[#F9FAFB]">Platform kill switch</h2>
          <p className="mt-1 text-xs text-[#9CA3AF]">
            Immediately blocks all non-admin access platform-wide.
          </p>
          <div className="mt-4">
            <KillSwitchToggle initialEnabled={settings?.maintenance_mode ?? false} />
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-[#111827]/40 p-5">
          <h2 className="text-sm font-medium text-[#F9FAFB]">Recent activity</h2>
          <div className="mt-3 flex flex-col gap-2">
            {(recentActivity ?? []).length === 0 && (
              <p className="text-xs text-[#9CA3AF]">Nothing logged yet.</p>
            )}
            {(recentActivity ?? []).map((entry, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-white/5 pb-2 text-xs last:border-0"
              >
                <span className="text-[#F9FAFB]">
                  {entry.action}
                  {entry.actor_email ? ` — ${entry.actor_email}` : ""}
                </span>
                <span className="text-[#6B7280]">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}