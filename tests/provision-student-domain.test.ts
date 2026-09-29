/*tests/provision-student-domain.test.ts*/
import { describe, it, expect } from "vitest";
import { extractDomain } from "@/lib/auth/provision-student";

describe("extractDomain", () => {
  it("extracts the domain from a simple email", () => expect(extractDomain("a@mrcet.ac.in")).toBe("mrcet.ac.in"));
  it("lowercases a mixed-case domain", () => expect(extractDomain("A@MRCET.AC.IN")).toBe("mrcet.ac.in"));
  it("trims surrounding whitespace", () => expect(extractDomain("  a@mrcet.ac.in  ")).toBe("mrcet.ac.in"));
  it("returns null for a string with no @", () => expect(extractDomain("not-an-email")).toBeNull());
  it("returns null for an email ending in @ with no domain", () => expect(extractDomain("a@")).toBeNull());
});