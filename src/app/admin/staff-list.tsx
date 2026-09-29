/*src/app/admin/staff-list.tsx*/
"use client";
import { useState, useTransition } from "react";
import { setStaffActive, updateStaffMember } from "@/app/admin/actions";
import type { Role } from "@/lib/auth/types";

type StaffRole = Extract<Role, "tpo" | "coordinator" | "company_hr">;

const STAFF_ROLES: { id: StaffRole; label: string }[] = [
  { id: "tpo", label: "TPO" },
  { id: "coordinator", label: "Coordinator" },
  { id: "company_hr", label: "Company HR" },
];

export type StaffRow = {
  id: string;
  email: string;
  role: StaffRole;
  college_id: string | null;
  is_active: boolean;
};

export function StaffList({
  staff,
  colleges,
}: {
  staff: StaffRow[];
  colleges: { id: string; name: string }[];
}) {
  if (staff.length === 0) {
    return <p className="text-xs text-[#9CA3AF]">No staff accounts yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {staff.map((s) => (
        <StaffRowItem key={s.id} staff={s} colleges={colleges} />
      ))}
    </div>
  );
}

function StaffRowItem({
  staff,
  colleges,
}: {
  staff: StaffRow;
  colleges: { id: string; name: string }[];
}) {
  const [role, setRole] = useState<StaffRole>(staff.role);
  const [collegeId, setCollegeId] = useState(staff.college_id ?? "");
  const [isActive, setIsActive] = useState(staff.is_active);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dirty = role !== staff.role || collegeId !== (staff.college_id ?? "");

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateStaffMember(staff.id, { role, collegeId });
      setMessage(result.success ? "Saved." : result.message);
    });
  }

  function handleToggleActive() {
    const next = !isActive;
    setMessage(null);
    startTransition(async () => {
      const result = await setStaffActive(staff.id, next);
      if (result.success) {
        setIsActive(next);
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-xs">
      <span className="min-w-[180px] text-[#F9FAFB]">{staff.email}</span>

      <select
        value={role}
        onChange={(e) => setRole(e.target.value as StaffRole)}
        className="rounded-md border border-white/10 bg-[#111827] px-2 py-1 text-[#F9FAFB]"
      >
        {STAFF_ROLES.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>

      <select
        value={collegeId}
        onChange={(e) => setCollegeId(e.target.value)}
        className="rounded-md border border-white/10 bg-[#111827] px-2 py-1 text-[#F9FAFB]"
      >
        {colleges.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
          isActive ? "bg-[#00FF88]/10 text-[#00FF88]" : "bg-[#F87171]/10 text-[#F87171]"
        }`}
      >
        {isActive ? "Active" : "Disabled"}
      </span>

      {dirty && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-[#00FF88] px-2 py-1 font-medium text-[#030712]"
        >
          Save
        </button>
      )}

      <button
        onClick={handleToggleActive}
        disabled={isPending}
        className="rounded-md border border-white/10 px-2 py-1 text-[#9CA3AF] transition-colors hover:text-[#F9FAFB]"
      >
        {isActive ? "Disable" : "Enable"}
      </button>

      {message && <span className="text-[#9CA3AF]">{message}</span>}
    </div>
  );
}