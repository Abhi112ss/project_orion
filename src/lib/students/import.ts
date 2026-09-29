/*src/lib/students/import.ts*/
import Papa from "papaparse";
import type { ZodIssue } from "zod";
import { studentImportRowSchema, parseAcademicYearRange, type StudentImportRow } from "@/lib/validation/students";

export type NormalizedStudentRow = {
  rollNumber: string;
  fullName: string;
  email: string;
  phone: string | null;
  branch: string;
  department: string | null;
  admissionYear: number | null;
  graduationYear: number | null;
  cgpa: number | null;
  backlogs: number;
  isActive: boolean;
  sourceCollege: string | null; // the CSV's own College column, for the mismatch warning — never written to the DB
};

export type ImportRowError = {
  row: number; // 1-based, matching what a spreadsheet user sees (header is row 1)
  errors: string[];
};

export type ImportRowWarning = {
  row: number;
  warning: string;
};

export type ParsedImport = {
  validRows: NormalizedStudentRow[];
  errors: ImportRowError[];
  warnings: ImportRowWarning[];
  duplicatesWithinFile: ImportRowError[];
};

/**
 * Parses and validates a CSV file's text content into normalized rows
 * ready for a bulk upsert, plus a structured error/warning report. Does
 * no database I/O — this is intentionally pure so it's testable without
 * mocking Supabase, and so validation can be re-run (e.g. a "dry run"
 * preview) without touching the database at all.
 *
 * expectedCollegeName: the name of the college the import is being run
 * for (chosen explicitly by the TPO in the UI, not inferred from the
 * file). If a row's own "College" column doesn't match, it becomes a
 * warning, not an error — the target college_id always comes from the
 * TPO's selection, never from file content.
 */
export function parseStudentImportCsv(
  csvText: string,
  expectedCollegeName?: string
): ParsedImport {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const validRows: NormalizedStudentRow[] = [];
  const errors: ImportRowError[] = [];
  const warnings: ImportRowWarning[] = [];
  const seenRollNumbers = new Map<string, number>(); // rollNumber -> first row seen
  const seenEmails = new Map<string, number>();
  const duplicatesWithinFile: ImportRowError[] = [];

  parsed.data.forEach((rawRow, index) => {
    const rowNumber = index + 2; // +1 for 0-index, +1 for the header row

    const result = studentImportRowSchema.safeParse(rawRow);
    if (!result.success) {
      errors.push({
        row: rowNumber,
        errors: result.error.issues.map((issue: ZodIssue) => `${issue.path.join(".")}: ${issue.message}`),
      });
      return;
    }

    const row: StudentImportRow = result.data;
    const rollNumber = row["Roll Number"];
    const email = row.Email;

    // Duplicate detection WITHIN this file — a duplicate against the
    // existing database is checked separately at upsert time (the
    // upsert itself handles that case by design, see importStudents).
    if (seenRollNumbers.has(rollNumber)) {
      duplicatesWithinFile.push({
        row: rowNumber,
        errors: [`Duplicate roll number "${rollNumber}" (first seen at row ${seenRollNumbers.get(rollNumber)})`],
      });
      return;
    }
    if (seenEmails.has(email)) {
      duplicatesWithinFile.push({
        row: rowNumber,
        errors: [`Duplicate email "${email}" (first seen at row ${seenEmails.get(email)})`],
      });
      return;
    }
    seenRollNumbers.set(rollNumber, rowNumber);
    seenEmails.set(email, rowNumber);

    if (
      expectedCollegeName &&
      row.College &&
      row.College.trim().toLowerCase() !== expectedCollegeName.trim().toLowerCase()
    ) {
      warnings.push({
        row: rowNumber,
        warning: `File says college "${row.College}", importing into "${expectedCollegeName}" — verify this is intentional`,
      });
    }

    const { admissionYear, graduationYear } = parseAcademicYearRange(row["Academic Year"]);

    validRows.push({
      rollNumber,
      fullName: row["Full Name"],
      email,
      phone: row.Phone || null,
      branch: row.Branch,
      department: row.Department || null,
      admissionYear,
      graduationYear,
      cgpa: row.CGPA ?? null,
      backlogs: row.Backlogs ?? 0,
      isActive: row.Active ?? true,
      sourceCollege: row.College || null,
    });
  });

  return { validRows, errors, warnings, duplicatesWithinFile };
}