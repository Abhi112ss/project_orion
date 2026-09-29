/*src/app/tpo/students/actions.ts*/
"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { logAudit } from "@/lib/audit/log";
import { parseStudentImportCsv } from "@/lib/students/import";
import { studentSchema } from "@/lib/validation/students";

const CHUNK_SIZE = 250;

export type ImportOutcome = {
  success: boolean;
  totalRows: number;
  imported: number;
  validationErrors: { row: number; errors: string[] }[];
  duplicatesWithinFile: { row: number; errors: string[] }[];
  warnings: { row: number; warning: string }[];
  chunkFailures: { chunkIndex: number; rollNumbers: string[]; message: string }[];
};

/**
 * Imports students from CSV text. college_id is NEVER taken from the
 * uploaded file or trusted client state for a normal tpo user — it
 * comes from their own SessionBundle, exactly like every other
 * tenant-scoped write in this app. Only super_admin (who has no fixed
 * college) may pass collegeIdOverride explicitly. Coordinator access
 * to student management is deferred — see AI_CONTEXT_TRANSFER_PHASE2A.md.
 *
 * Inserted via the normal authenticated client, not the service-role
 * client — RLS's own insert policy on students already enforces
 * "TPO/Coordinator can insert for their own college", so there's no
 * reason to bypass it here. Chunked (250 rows/chunk) so one bad row's
 * unique-constraint conflict doesn't take down an entire 1,500+ row
 * import — a failure is scoped to its chunk, reported by which roll
 * numbers were in it, and every other chunk still commits. See
 * AI_CONTEXT_TRANSFER_PHASE2A.md for the known limitation this implies
 * (a chunk failure doesn't tell you exactly which single row inside it
 * was the problem) and the recommended fix.
 */
export async function importStudents(csvText: string, collegeIdOverride?: string): Promise<ImportOutcome> {
  const bundle = await requireRole(["tpo"]);
  const collegeId = bundle.role === "super_admin" ? collegeIdOverride : bundle.collegeId;

  if (!collegeId) {
    return {
      success: false,
      totalRows: 0,
      imported: 0,
      validationErrors: [],
      duplicatesWithinFile: [],
      warnings: [],
      chunkFailures: [{ chunkIndex: -1, rollNumbers: [], message: "No college selected for this import." }],
    };
  }

  const supabase = await createClient();

  const { data: college } = await supabase.from("colleges").select("name").eq("id", collegeId).maybeSingle();

  const { validRows, errors, warnings, duplicatesWithinFile } = parseStudentImportCsv(csvText, college?.name);

  const chunkFailures: ImportOutcome["chunkFailures"] = [];
  let imported = 0;

  for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
    const chunk = validRows.slice(i, i + CHUNK_SIZE);
    const payload = chunk.map((row) => ({
      college_id: collegeId,
      roll_number: row.rollNumber,
      full_name: row.fullName,
      email: row.email,
      phone: row.phone,
      branch: row.branch,
      department: row.department,
      admission_year: row.admissionYear,
      graduation_year: row.graduationYear,
      cgpa: row.cgpa,
      backlogs: row.backlogs,
      is_active: row.isActive,
    }));

    const { error } = await supabase.from("students").upsert(payload, { onConflict: "college_id,roll_number" });

    if (error) {
      console.error("importStudents chunk failed:", error.code, error.message);
      chunkFailures.push({
        chunkIndex: Math.floor(i / CHUNK_SIZE),
        rollNumbers: chunk.map((r) => r.rollNumber),
        message: error.message,
      });
    } else {
      imported += chunk.length;
    }
  }

  // One audit entry summarizing the whole batch — not one per student
  // row. At 50,000-student scale, per-row audit entries for a routine
  // bulk import would drown out everything else in the log.
  await logAudit({
    actorId: bundle.userId,
    actorEmail: bundle.email,
    action: "students_imported",
    targetType: "college",
    targetId: collegeId,
    metadata: {
      totalRows: validRows.length + errors.length + duplicatesWithinFile.length,
      imported,
      validationErrorCount: errors.length,
      duplicateCount: duplicatesWithinFile.length,
      chunkFailureCount: chunkFailures.length,
    },
  });

  return {
    success: chunkFailures.length === 0 && errors.length === 0,
    totalRows: validRows.length + errors.length + duplicatesWithinFile.length,
    imported,
    validationErrors: errors,
    duplicatesWithinFile,
    warnings,
    chunkFailures,
  };
}

/**
 * Inline edit for the fields the student list UI actually exposes.
 * Deliberately not every column on the table — a fuller edit form is a
 * follow-up, not something to fake with a partial one right now.
 */
export async function updateStudent(
  studentId: string,
  updates: { fullName?: string; phone?: string; branch?: string; cgpa?: number; backlogs?: number }
) {
  const bundle = await requireRole(["tpo"]);

  const parsed = studentSchema
    .pick({ fullName: true, phone: true, branch: true, cgpa: true, backlogs: true })
    .partial()
    .safeParse(updates);

  if (!parsed.success) {
    return { success: false as const, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      branch: parsed.data.branch,
      cgpa: parsed.data.cgpa,
      backlogs: parsed.data.backlogs,
    })
    .eq("id", studentId);

  if (error) {
    return { success: false as const, message: error.message };
  }

  await logAudit({
    actorId: bundle.userId,
    actorEmail: bundle.email,
    action: "student_updated",
    targetType: "student",
    targetId: studentId,
  });

  return { success: true as const };
}

export async function setStudentActive(studentId: string, isActive: boolean) {
  const bundle = await requireRole(["tpo"]);
  const supabase = await createClient();

  const { error } = await supabase.from("students").update({ is_active: isActive }).eq("id", studentId);

  if (error) {
    return { success: false as const, message: error.message };
  }

  await logAudit({
    actorId: bundle.userId,
    actorEmail: bundle.email,
    action: isActive ? "student_enabled" : "student_disabled",
    targetType: "student",
    targetId: studentId,
  });

  return { success: true as const };
}