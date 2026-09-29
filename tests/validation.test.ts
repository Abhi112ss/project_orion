/*tests/validation.test.ts*/
import { describe, it, expect } from "vitest";
import {
  emailSchema,
  otpCodeSchema,
  provisionStaffSchema,
  updateStaffSchema,
  featureFlagKeySchema,
} from "@/lib/validation/schemas";

const VALID_UUID = "11111111-1111-1111-1111-111111111111";

describe("emailSchema", () => {
  it("accepts a valid email", () => expect(emailSchema.safeParse("a@b.com").success).toBe(true));
  it("lowercases the email", () => expect(emailSchema.parse("A@B.COM")).toBe("a@b.com"));
  it("trims surrounding whitespace", () => expect(emailSchema.parse("  a@b.com  ")).toBe("a@b.com"));
  it("rejects a string with no @", () => expect(emailSchema.safeParse("not-an-email").success).toBe(false));
  it("rejects an empty string", () => expect(emailSchema.safeParse("").success).toBe(false));
});

describe("otpCodeSchema", () => {
  it("accepts a 6-digit code", () => expect(otpCodeSchema.safeParse("123456").success).toBe(true));
  it("rejects a 5-digit code", () => expect(otpCodeSchema.safeParse("12345").success).toBe(false));
  it("rejects a 7-digit code", () => expect(otpCodeSchema.safeParse("1234567").success).toBe(false));
  it("rejects letters mixed into the code", () => expect(otpCodeSchema.safeParse("12a456").success).toBe(false));
  it("trims surrounding whitespace before checking length", () =>
    expect(otpCodeSchema.safeParse("  123456  ").success).toBe(true));
});

describe("provisionStaffSchema", () => {
  it("accepts a valid tpo payload", () =>
    expect(
      provisionStaffSchema.safeParse({ email: "x@y.com", fullName: "X", role: "tpo", collegeId: VALID_UUID })
        .success
    ).toBe(true));
  it("rejects student as a staff role", () =>
    expect(
      provisionStaffSchema.safeParse({ email: "x@y.com", role: "student", collegeId: VALID_UUID }).success
    ).toBe(false));
  it("rejects super_admin as a staff role", () =>
    expect(
      provisionStaffSchema.safeParse({ email: "x@y.com", role: "super_admin", collegeId: VALID_UUID }).success
    ).toBe(false));
  it("rejects a non-uuid collegeId", () =>
    expect(
      provisionStaffSchema.safeParse({ email: "x@y.com", role: "tpo", collegeId: "not-a-uuid" }).success
    ).toBe(false));
  it("allows fullName to be omitted", () =>
    expect(provisionStaffSchema.safeParse({ email: "x@y.com", role: "tpo", collegeId: VALID_UUID }).success).toBe(
      true
    ));
});

describe("updateStaffSchema", () => {
  it("accepts a valid role/college pair", () =>
    expect(updateStaffSchema.safeParse({ role: "coordinator", collegeId: VALID_UUID }).success).toBe(true));
  it("rejects an unknown role string", () =>
    expect(updateStaffSchema.safeParse({ role: "not_a_role", collegeId: VALID_UUID }).success).toBe(false));
});

describe("featureFlagKeySchema", () => {
  it("accepts a known flag key", () => expect(featureFlagKeySchema.safeParse("FEATURE_AI").success).toBe(true));
  it("rejects an unknown flag key", () =>
    expect(featureFlagKeySchema.safeParse("FEATURE_NOT_REAL").success).toBe(false));
});