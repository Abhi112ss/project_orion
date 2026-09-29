/*src/lib/validation/students.ts*/
import { z } from "zod";

export const placementStatusSchema = z.enum(["not_placed", "placed", "opted_out", "not_eligible"]);

// The full entity shape — used when updating a student record directly
// (not via import).
export const studentSchema = z.object({
  rollNumber: z.string().trim().min(1).max(50),
  universityNumber: z.string().trim().max(50).optional().or(z.literal("")),
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  branch: z.string().trim().min(1).max(50),
  department: z.string().trim().max(100).optional().or(z.literal("")),
  section: z.string().trim().max(10).optional().or(z.literal("")),
  year: z.coerce.number().int().min(1).max(6).optional(),
  admissionYear: z.coerce.number().int().min(2000).max(2100).optional(),
  graduationYear: z.coerce.number().int().min(2000).max(2100).optional(),
  cgpa: z.coerce.number().min(0).max(10).optional(),
  backlogs: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

/**
 * The reference CSV format ("Roll Number, Full Name, Email, Phone,
 * College, Branch, Department, Academic Year, CGPA, Backlogs, Active")
 * doesn't include university_number, section, year, skills, or the
 * resume/social links that the full schema allows for — those stay
 * optional here rather than being required, so real import data
 * actually validates. The "College" column is deliberately NOT parsed
 * into college_id: the import always happens in the context of one
 * TPO-selected college (see importStudents), so a mismatched or
 * differently-spelled college name in the file is not a hard error —
 * it's surfaced as a warning row for the importer to eyeball, since
 * college names in source data are notoriously inconsistent.
 */
export const studentImportRowSchema = z.object({
  "Roll Number": z.string().trim().min(1, "Roll number is required"),
  "Full Name": z.string().trim().min(1, "Full name is required"),
  Email: z.string().trim().toLowerCase().pipe(z.string().email("Invalid email")),
  Phone: z.string().trim().optional(),
  College: z.string().trim().optional(),
  Branch: z.string().trim().min(1, "Branch is required"),
  Department: z.string().trim().optional(),
  "Academic Year": z.string().trim().optional(),
  CGPA: z.coerce.number().min(0).max(10).optional(),
  Backlogs: z.coerce.number().int().min(0).default(0),
  Active: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => v === "true" || v === "1" || v === "yes")
    .optional(),
});

export type StudentImportRow = z.infer<typeof studentImportRowSchema>;

/**
 * Parses "2022-2026" into { admissionYear: 2022, graduationYear: 2026 }.
 * Returns nulls for anything that doesn't match — never throws, since
 * a malformed academic year shouldn't fail the whole row when every
 * other field is fine.
 */
export function parseAcademicYearRange(
  raw: string | undefined
): { admissionYear: number | null; graduationYear: number | null } {
  if (!raw) return { admissionYear: null, graduationYear: null };
  const match = raw.match(/^(\d{4})\s*-\s*(\d{4})$/);
  if (!match) return { admissionYear: null, graduationYear: null };
  return { admissionYear: Number(match[1]), graduationYear: Number(match[2]) };
}