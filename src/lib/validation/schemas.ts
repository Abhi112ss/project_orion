/*src/lib/validation/schemas.ts*/
import { z } from "zod";

// Normalizes as it validates: trims and lowercases, so every caller
// downstream (RLS checks, profile lookups, domain matching) works
// against one consistent form of the address.
export const emailSchema = z.string().trim().toLowerCase().email();

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Code must be exactly 6 digits");

export const staffRoleSchema = z.enum(["tpo", "coordinator", "company_hr"]);

export const provisionStaffSchema = z.object({
  email: emailSchema,
  fullName: z.string().trim().max(200).optional().or(z.literal("")),
  role: staffRoleSchema,
  collegeId: z.string().uuid(),
});

export const updateStaffSchema = z.object({
  role: staffRoleSchema,
  collegeId: z.string().uuid(),
});

export const featureFlagKeySchema = z.enum(["FEATURE_EMAILS", "FEATURE_AI", "FEATURE_ANALYTICS"]);