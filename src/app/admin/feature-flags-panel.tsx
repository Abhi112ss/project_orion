/*src/app/admin/feature-flags-panel.tsx*/

"use client";
import { useState, useTransition } from "react";
import { setFeatureFlag } from "@/app/admin/actions";

export type FeatureFlagRow = {
  key: string;
  enabled: boolean;
  description: string | null;
};

export function FeatureFlagsPanel({ flags }: { flags: FeatureFlagRow[] }) {
  return (
    <div className="flex flex-col gap-2">
      {flags.map((f) => (
        <FlagRow key={f.key} flag={f} />
      ))}
    </div>
  );
}

function FlagRow({ flag }: { flag: FeatureFlagRow }) {
  const [enabled, setEnabled] = useState(flag.enabled);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !enabled;
    startTransition(async () => {
      const result = await setFeatureFlag(flag.key, next);
      if (result.success) setEnabled(next);
    });
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
      <div>
        <p className="font-medium text-[#F9FAFB]">{flag.key}</p>
        {flag.description && <p className="mt-0.5 text-[#9CA3AF]">{flag.description}</p>}
      </div>
      <button
        onClick={toggle}
        disabled={isPending}
        className={`rounded-md px-3 py-1 font-medium transition-colors ${
          enabled ? "bg-[#00FF88] text-[#030712]" : "border border-white/10 text-[#9CA3AF]"
        }`}
      >
        {enabled ? "On" : "Off"}
      </button>
    </div>
  );
}