/*tests/role-routes.test.ts*/
import { describe, it, expect } from "vitest";
import { roleHome, canAccessRole } from "@/lib/auth/role-routes";

describe("roleHome", () => {
  it("maps tpo to /tpo", () => expect(roleHome("tpo")).toBe("/tpo"));
  it("maps coordinator to /coordinator", () => expect(roleHome("coordinator")).toBe("/coordinator"));
  it("maps company_hr to /company-hr", () => expect(roleHome("company_hr")).toBe("/company-hr"));
  it("maps student to /student", () => expect(roleHome("student")).toBe("/student"));
  it("maps super_admin to /admin", () => expect(roleHome("super_admin")).toBe("/admin"));
});

describe("canAccessRole", () => {
  it("allows an exact role match", () => expect(canAccessRole("tpo", ["tpo"])).toBe(true));
  it("denies a non-matching role", () => expect(canAccessRole("student", ["tpo"])).toBe(false));
  it("denies a valid role that isn't in the allowed list", () =>
    expect(canAccessRole("coordinator", ["tpo", "company_hr"])).toBe(false));
  it("super_admin always passes, regardless of the allowed list", () =>
    expect(canAccessRole("super_admin", ["tpo"])).toBe(true));
  it("super_admin passes even with an empty allowed list", () =>
    expect(canAccessRole("super_admin", [])).toBe(true));
  it("a non-super_admin is denied with an empty allowed list", () =>
    expect(canAccessRole("student", [])).toBe(false));
  it("allows any one of several roles in the allowed list", () =>
    expect(canAccessRole("company_hr", ["tpo", "coordinator", "company_hr"])).toBe(true));
});