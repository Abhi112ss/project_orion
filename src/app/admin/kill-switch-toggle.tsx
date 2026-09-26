"use client";

import { useState, useTransition } from "react";
import { setMaintenanceMode } from "@/app/admin/actions";

export function KillSwitchToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !enabled;

    if (
      next &&
      !window.confirm(
        "This immediately blocks all non-admin access to the entire platform. Continue?"
      )
    ) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await setMaintenanceMode(next);
      if (result.success) {
        setEnabled(next);
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          enabled
            ? "bg-[#F87171] text-[#030712] hover:bg-[#F87171]/90"
            : "border border-white/10 bg-white/5 text-[#F9FAFB] hover:bg-white/10"
        }`}
      >
        {isPending ? "Updating…" : enabled ? "Disable kill switch" : "Enable kill switch"}
      </button>
      {enabled && (
        <p className="mt-2 text-xs text-[#F87171]">
          Active — everyone except super admins is currently being redirected to /maintenance.
        </p>
      )}
      {message && <p className="mt-2 text-xs text-muted">{message}</p>}
    </div>
  );
}