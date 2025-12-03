// app/api/attendance/all/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AttendanceModeType =
  | "IN_OFFICE"
  | "WORK_FROM_HOME"
  | "ON_DUTY"
  | "REGULARIZATION";

interface AttendanceRecordOut {
  _id: string;
  employeeId: string;
  employeeName?: string | null;
  date: string; // "YYYY-MM-DD"
  punchInTime?: string | null;
  punchOutTime?: string | null;
  mode?: AttendanceModeType;
  punchInLatitude?: number | null;
  punchInLongitude?: number | null;
  punchOutLatitude?: number | null;
  punchOutLongitude?: number | null;
}

// Handle both old Date docs and new string docs safely
function normalizeDateField(value: any): string {
  if (!value) return "";

  // already "YYYY-MM-DD"
  if (typeof value === "string" && value.length === 10 && !value.includes("T")) {
    return value;
  }

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD" in UTC
}

export async function GET() {
  try {
    await connectDB();

    // ✅ Get ALL attendance records, newest first
    const dbRecords = await Attendance.find({})
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Unique employee IDs
    const employeeIds = Array.from(
      new Set(dbRecords.map((r: any) => r.employeeId))
    );

    // Fetch employee names
    const employees = await Employee.find({
      empId: { $in: employeeIds },
    })
      .select("empId name")
      .lean();

    const nameMap = new Map<string, string>();
    employees.forEach((emp: any) => {
      const key = emp.empId || emp.employeeId;
      if (key && emp.name) {
        nameMap.set(key, emp.name);
      }
    });

    const records: AttendanceRecordOut[] = dbRecords.map((r: any) => ({
      _id: r._id.toString(),
      employeeId: r.employeeId,
      employeeName: nameMap.get(r.employeeId) || null,
      date: normalizeDateField(r.date), // ensure "YYYY-MM-DD"
      punchInTime: r.punchInTime || null,
      punchOutTime: r.punchOutTime || null,
      mode: (r.mode as AttendanceModeType) || "IN_OFFICE",
      punchInLatitude: r.punchInLatitude ?? null,
      punchInLongitude: r.punchInLongitude ?? null,
      punchOutLatitude: r.punchOutLatitude ?? null,
      punchOutLongitude: r.punchOutLongitude ?? null,
    }));

    // Final sort: date desc, then name
    records.sort((a, b) => {
      if (a.date === b.date) {
        return (a.employeeName || "").localeCompare(b.employeeName || "");
      }
      return a.date < b.date ? 1 : -1;
    });

    return NextResponse.json({ records }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching attendance:", err);
    return NextResponse.json(
      { error: "Failed to fetch attendance records." },
      { status: 500 }
    );
  }
}
