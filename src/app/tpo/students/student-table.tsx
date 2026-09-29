/*src/app/tpo/students/student-table.tsx*/
"use client";

import { useState, useTransition } from "react";
import { setStudentActive, updateStudent } from "@/app/tpo/students/actions";
import type { StudentRow } from "@/lib/students/queries";

export function StudentTable({ rows }: { rows: StudentRow[] }) {
  if (rows.length === 0) {
    return <p className="text-xs text-[#9CA3AF]">No students match this search.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/5 text-[#9CA3AF]">
          <tr>
            <th className="px-3 py-2 font-medium">Roll No.</th>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Branch</th>
            <th className="px-3 py-2 font-medium">CGPA</th>
            <th className="px-3 py-2 font-medium">Backlogs</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Active</th>
            <th className="px-3 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((student) => (
            <StudentRowItem key={student.id} student={student} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StudentRowItem({ student }: { student: StudentRow }) {
  const [editing, setEditing] = useState(false);
  const [branch, setBranch] = useState(student.branch);
  const [cgpa, setCgpa] = useState(student.cgpa ?? 0);
  const [backlogs, setBacklogs] = useState(student.backlogs);
  const [isActive, setIsActive] = useState(student.is_active);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateStudent(student.id, { branch, cgpa, backlogs });
      if (result.success) {
        setEditing(false);
      } else {
        setMessage(result.message);
      }
    });
  }

  function handleToggleActive() {
    const next = !isActive;
    setMessage(null);
    startTransition(async () => {
      const result = await setStudentActive(student.id, next);
      if (result.success) {
        setIsActive(next);
      } else {
        setMessage(result.message);
      }
    });
  }

  return (
    <tr className="border-t border-white/5">
      <td className="px-3 py-2 text-[#F9FAFB]">{student.roll_number}</td>
      <td className="px-3 py-2 text-[#F9FAFB]">{student.full_name}</td>
      <td className="px-3 py-2 text-[#9CA3AF]">{student.email}</td>
      <td className="px-3 py-2">
        {editing ? (
          <input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-16 rounded border border-white/10 bg-[#111827] px-1 py-0.5 text-[#F9FAFB]"
          />
        ) : (
          <span className="text-[#9CA3AF]">{student.branch}</span>
        )}
      </td>
      <td className="px-3 py-2">
        {editing ? (
          <input
            type="number"
            step="0.01"
            value={cgpa}
            onChange={(e) => setCgpa(Number(e.target.value))}
            className="w-16 rounded border border-white/10 bg-[#111827] px-1 py-0.5 text-[#F9FAFB]"
          />
        ) : (
          <span className="text-[#9CA3AF]">{student.cgpa ?? "—"}</span>
        )}
      </td>
      <td className="px-3 py-2">
        {editing ? (
          <input
            type="number"
            value={backlogs}
            onChange={(e) => setBacklogs(Number(e.target.value))}
            className="w-14 rounded border border-white/10 bg-[#111827] px-1 py-0.5 text-[#F9FAFB]"
          />
        ) : (
          <span className="text-[#9CA3AF]">{student.backlogs}</span>
        )}
      </td>
      <td className="px-3 py-2 text-[#9CA3AF]">{student.placement_status}</td>
      <td className="px-3 py-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            isActive ? "bg-[#00FF88]/10 text-[#00FF88]" : "bg-[#F87171]/10 text-[#F87171]"
          }`}
        >
          {isActive ? "Active" : "Disabled"}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1.5">
          {editing ? (
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-md bg-[#00FF88] px-2 py-1 font-medium text-[#030712]"
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="rounded-md border border-white/10 px-2 py-1 text-[#9CA3AF] hover:text-[#F9FAFB]"
            >
              Edit
            </button>
          )}
          <button
            onClick={handleToggleActive}
            disabled={isPending}
            className="rounded-md border border-white/10 px-2 py-1 text-[#9CA3AF] hover:text-[#F9FAFB]"
          >
            {isActive ? "Disable" : "Enable"}
          </button>
        </div>
        {message && <p className="mt-1 text-[10px] text-[#F87171]">{message}</p>}
      </td>
    </tr>
  );
}