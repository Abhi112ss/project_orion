/*src/app/admin/staff-form.tsx*/

"use client";
import { useState, useTransition } from "react";
import { provisionStaff } from "@/app/admin/actions";
import type { Role } from "@/lib/auth/types";

type StaffRole = Extract<Role, "tpo" | "coordinator" | "company_hr">;

const STAFF_ROLES: { id: StaffRole; label: string }[] = [
  { id: "tpo", label: "TPO" },
  { id: "coordinator", label: "Coordinator" },
  { id: "company_hr", label: "Company HR" },
];

export function StaffProvisionForm({ colleges }: { colleges: { id: string; name: string }[] }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<StaffRole>("tpo");
  const [collegeId, setCollegeId] = useState(colleges[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const result = await provisionStaff({ email, fullName, role, collegeId });
      if (result.success) {
        setMessage(`Created ${email} as ${role}.`);
        setEmail("");
        setFullName("");
      } else {
        setMessage(result.message);
      }
    });
  }

  if (colleges.length === 0) {
    return (
      <p className="text-xs text-[#9CA3AF]">
        No colleges exist yet — add one to the colleges table before provisioning staff.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        placeholder="Staff email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[#F9FAFB] outline-none placeholder:text-[#6B7280]"
      />
      <input
        type="text"
        placeholder="Full name (optional)"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[#F9FAFB] outline-none placeholder:text-[#6B7280]"
      />

      <div className="grid grid-cols-3 gap-2">
        {STAFF_ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRole(r.id)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              role === r.id
                ? "bg-[#0B1220] text-[#F9FAFB] shadow-[0_0_0_1px_rgba(0,255,136,0.4)]"
                : "border border-white/10 bg-white/5 text-[#9CA3AF]"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <select
        value={collegeId}
        onChange={(e) => setCollegeId(e.target.value)}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-[#F9FAFB] outline-none"
      >
        {colleges.map((c) => (
          <option key={c.id} value={c.id} className="bg-[#111827]">
            {c.name}
          </option>
        ))}
      </select>

      {message && <p className="text-xs text-[#9CA3AF]">{message}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-[#00FF88] px-4 py-2 text-sm font-semibold text-[#030712] transition-colors hover:bg-[#00FF88]/90"
      >
        {isPending ? "Creating…" : "Create staff account"}
      </button>
    </form>
  );
}