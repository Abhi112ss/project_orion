/*tests/students.test.ts*/
import { describe, it, expect } from "vitest";
import { parseStudentImportCsv } from "@/lib/students/import";
import { parseAcademicYearRange } from "@/lib/validation/students";

const HEADER = "Roll Number,Full Name,Email,Phone,College,Branch,Department,Academic Year,CGPA,Backlogs,Active";

function csv(...rows: string[]): string {
  return [HEADER, ...rows].join("\n");
}

describe("parseAcademicYearRange", () => {
  it("parses a valid range", () => {
    expect(parseAcademicYearRange("2022-2026")).toEqual({ admissionYear: 2022, graduationYear: 2026 });
  });
  it("returns nulls for an unparseable string", () => {
    expect(parseAcademicYearRange("not a range")).toEqual({ admissionYear: null, graduationYear: null });
  });
  it("returns nulls for undefined", () => {
    expect(parseAcademicYearRange(undefined)).toEqual({ admissionYear: null, graduationYear: null });
  });
});

describe("parseStudentImportCsv — real reference-format rows", () => {
  it("parses a valid row into a normalized record", () => {
    const result = parseStudentImportCsv(
      csv('"23BD1A0001","Kavya Shah","kavya.shah0001@college.edu","+91 9780515236","Institute of Engineering & Technology","EEE","Engineering","2022-2026",9.01,0,true')
    );
    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0]).toMatchObject({
      rollNumber: "23BD1A0001",
      fullName: "Kavya Shah",
      email: "kavya.shah0001@college.edu",
      branch: "EEE",
      department: "Engineering",
      admissionYear: 2022,
      graduationYear: 2026,
      cgpa: 9.01,
      backlogs: 0,
      isActive: true,
    });
  });

  it("rejects a row with an invalid email", () => {
    const result = parseStudentImportCsv(
      csv('"23BD1A0002","Varun Bose","not-an-email","+91 9161611065","College","CIVIL","Engineering","2022-2026",7.21,0,true')
    );
    expect(result.validRows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
  });

  it("rejects a row missing a roll number", () => {
    const result = parseStudentImportCsv(
      csv('"","Varun Bose","varun@college.edu","+91 9161611065","College","CIVIL","Engineering","2022-2026",7.21,0,true')
    );
    expect(result.errors).toHaveLength(1);
  });

  it("catches a duplicate roll number within the same file", () => {
    const result = parseStudentImportCsv(
      csv(
        '"23BD1A0001","Kavya Shah","kavya@college.edu","","College","EEE","Engineering","2022-2026",9.01,0,true',
        '"23BD1A0001","Duplicate Roll","other@college.edu","","College","CSE","CS","2022-2026",8.0,0,true'
      )
    );
    expect(result.validRows).toHaveLength(1);
    expect(result.duplicatesWithinFile).toHaveLength(1);
    expect(result.duplicatesWithinFile[0].row).toBe(3);
  });

  it("catches a duplicate email within the same file", () => {
    const result = parseStudentImportCsv(
      csv(
        '"23BD1A0001","Kavya Shah","same@college.edu","","College","EEE","Engineering","2022-2026",9.01,0,true',
        '"23BD1A0002","Other Person","same@college.edu","","College","CSE","CS","2022-2026",8.0,0,true'
      )
    );
    expect(result.validRows).toHaveLength(1);
    expect(result.duplicatesWithinFile).toHaveLength(1);
  });

  it("warns, but does not error, on a college-name mismatch", () => {
    const result = parseStudentImportCsv(
      csv('"23BD1A0001","Kavya Shah","kavya@college.edu","","Some Other College","EEE","Engineering","2022-2026",9.01,0,true'),
      "Malla Reddy College of Engineering & Technology (MRCET)"
    );
    expect(result.errors).toHaveLength(0);
    expect(result.validRows).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].warning).toMatch(/Some Other College/);
  });

  it("does not warn when the college name matches", () => {
    const result = parseStudentImportCsv(
      csv('"23BD1A0001","Kavya Shah","kavya@college.edu","","MRCET","EEE","Engineering","2022-2026",9.01,0,true'),
      "MRCET"
    );
    expect(result.warnings).toHaveLength(0);
  });

  it("defaults missing Active/Backlogs sensibly", () => {
    const result = parseStudentImportCsv(
      csv('"23BD1A0001","Kavya Shah","kavya@college.edu","","College","EEE","Engineering","2022-2026",9.01,,')
    );
    expect(result.validRows[0].backlogs).toBe(0);
  });

  it("rejects a CGPA above the valid range", () => {
    const result = parseStudentImportCsv(
      csv('"23BD1A0001","Kavya Shah","kavya@college.edu","","College","EEE","Engineering","2022-2026",15,0,true')
    );
    expect(result.errors).toHaveLength(1);
  });
});