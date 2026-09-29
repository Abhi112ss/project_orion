/*src/app/tpo/students/import-form.tsx*/
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importStudents, type ImportOutcome } from "@/app/tpo/students/actions";

export function StudentImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setOutcome(null);

    const reader = new FileReader();
    reader.onload = () => {
      const csvText = String(reader.result ?? "");
      startTransition(async () => {
        const result = await importStudents(csvText);
        setOutcome(result);
        if (result.imported > 0) router.refresh();
      });
    };
    reader.readAsText(file);
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-6 text-center text-xs text-[#9CA3AF] transition-colors hover:border-[#00FF88]/40">
        <span>
          {isPending
            ? "Importing…"
            : fileName
              ? `Selected: ${fileName}`
              : "Click to choose a CSV file (Roll Number, Full Name, Email, Branch, ...)"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={isPending}
          className="hidden"
        />
      </label>

      {outcome && (
        <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-xs">
          <p className="font-medium text-[#F9FAFB]">
            {outcome.imported} of {outcome.totalRows} rows imported
            {outcome.success ? "." : " — some rows need attention."}
          </p>

          {outcome.validationErrors.length > 0 && (
            <ReportSection
              label={`Validation errors (${outcome.validationErrors.length})`}
              color="text-[#F87171]"
              items={outcome.validationErrors.map((e) => `Row ${e.row}: ${e.errors.join("; ")}`)}
            />
          )}

          {outcome.duplicatesWithinFile.length > 0 && (
            <ReportSection
              label={`Duplicates within file (${outcome.duplicatesWithinFile.length})`}
              color="text-[#F87171]"
              items={outcome.duplicatesWithinFile.map((e) => `Row ${e.row}: ${e.errors.join("; ")}`)}
            />
          )}

          {outcome.chunkFailures.length > 0 && (
            <ReportSection
              label={`Batch failures (${outcome.chunkFailures.length})`}
              color="text-[#F87171]"
              items={outcome.chunkFailures.map(
                (f) => `Batch ${f.chunkIndex} (${f.rollNumbers.length} rows): ${f.message}`
              )}
            />
          )}

          {outcome.warnings.length > 0 && (
            <ReportSection
              label={`Warnings (${outcome.warnings.length})`}
              color="text-[#9CA3AF]"
              items={outcome.warnings.map((w) => `Row ${w.row}: ${w.warning}`)}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ReportSection({ label, color, items }: { label: string; color: string; items: string[] }) {
  const shown = items.slice(0, 20);
  return (
    <div>
      <p className={`font-medium ${color}`}>{label}</p>
      <ul className="mt-1 max-h-40 overflow-y-auto text-[#9CA3AF]">
        {shown.map((item, i) => (
          <li key={i} className="truncate">
            {item}
          </li>
        ))}
      </ul>
      {items.length > shown.length && (
        <p className="mt-1 text-[#6B7280]">…and {items.length - shown.length} more</p>
      )}
    </div>
  );
}