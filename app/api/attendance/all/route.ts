import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helper to ensure date is YYYY-MM-DD
function extractDateKey(value: string | Date | undefined | null): string {
  if (!value) return "";
  if (typeof value === "string") {
    if (value.length === 10 && !value.includes("T")) return value;
    const d = new Date(value);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }
  const d = new Date(value as Date);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

type AttendanceModeType =
  | "IN_OFFICE"
  | "WORK_FROM_HOME"
  | "ON_DUTY"
  | "REGULARIZATION";

interface AttendanceRecordOut {
  _id: string;
  employeeId: string;
  employeeName?: string | null;
  date: string;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  mode?: AttendanceModeType;
  punchInLatitude?: number | null;
  punchInLongitude?: number | null;
  punchOutLatitude?: number | null;
  punchOutLongitude?: number | null;
  punchInBranch?: string | null;
  punchOutBranch?: string | null;
}

export async function GET() {
  try {
    await connectDB();

    // 1. Fetch Records from MongoDB
    const dbRecords = await Attendance.find({})
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // 2. Map Employee Names from Employee Collection
    const employeeIds = Array.from(new Set(dbRecords.map((r: any) => r.employeeId)));
    const employees = await Employee.find({ empId: { $in: employeeIds } })
      .select("empId name")
      .lean();

    const nameMap = new Map<string, string>();
    employees.forEach((emp: any) => {
      const key = emp.empId;
      if (key && emp.name) nameMap.set(key, emp.name);
    });

    // 3. Transform Data for Frontend
    const finalRecords: AttendanceRecordOut[] = dbRecords.map((r: any) => ({
      _id: r._id.toString(),
      employeeId: r.employeeId,
      employeeName: nameMap.get(r.employeeId) || null,
      date: extractDateKey(r.date),
      punchInTime: r.punchInTime ? new Date(r.punchInTime).toISOString() : null,
      punchOutTime: r.punchOutTime ? new Date(r.punchOutTime).toISOString() : null,
      mode: (r.mode as AttendanceModeType) || "IN_OFFICE",
      punchInLatitude: r.punchInLatitude ?? null,
      punchInLongitude: r.punchInLongitude ?? null,
      punchOutLatitude: r.punchOutLatitude ?? null,
      punchOutLongitude: r.punchOutLongitude ?? null,
      punchInBranch: r.punchInBranch || null,
      punchOutBranch: r.punchOutBranch || null,
    }));

    return NextResponse.json({ records: finalRecords }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching attendance:", err);
    return NextResponse.json(
      { error: "Failed to fetch attendance records." },
      { status: 500 }
    );
  }
}