"use client";

import { Building2, GraduationCap, ShieldCheck, Users2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/auth/types";

// Re-exported so existing imports of `LoginRole` keep working — it's
// the same type as Role in lib/auth/types, just aliased for the UI.
export type LoginRole = Role;

interface RoleOption {
  id: Role;
  label: string;
  icon: LucideIcon;
}

const ROLES: RoleOption[] = [
  { id: "tpo", label: "TPO", icon: ShieldCheck },
  { id: "coordinator", label: "Coordinator", icon: Users2 },
  { id: "company_hr", label: "Company HR", icon: Building2 },
  { id: "student", label: "Student", icon: GraduationCap },
];

export const ROLE_COPY: Record<Role, { title: string; subtitle: string }> = {
  tpo: {
    title: "TPO access",
    subtitle: "Manage placement drives, recruiters, and college-wide reports.",
  },
  coordinator: {
    title: "Coordinator access",
    subtitle: "Track student readiness and coordinate drives for your department.",
  },
  company_hr: {
    title: "Company HR access",
    subtitle: "Post drives, review applicants, and schedule interviews.",
  },
  student: {
    title: "Student access",
    subtitle: "New here? Sign in with your college email to create your account.",
  },
  super_admin: {
    title: "Super admin access",
    subtitle: "Full platform access across every role.",
  },
};

export function RoleTabs({
  value,
  onChange,
}: {
  value: Role;
  onChange: (role: Role) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Sign in as"
      className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/5 p-1"
    >
      {ROLES.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(id)}
            className={`flex flex-col items-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-medium transition-colors ${
              active
                ? "bg-[#0B1220] text-[#F9FAFB] shadow-[0_0_0_1px_rgba(0,255,136,0.4)]"
                : "text-[#9CA3AF] hover:text-[#F9FAFB]"
            }`}
          >
            <Icon className={`size-4 ${active ? "text-[#00FF88]" : ""}`} />
            {label}
          </button>
        );
      })}
    </div>
  );
}