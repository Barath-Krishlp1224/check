// app/api/attendance/all/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee"; // adjust path if different

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // Get all attendance records, newest first
    const records = await Attendance.find({})
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Collect unique employee IDs
    const employeeIds = Array.from(
      new Set(records.map((r: any) => r.employeeId))
    );

    // Fetch basic employee info
    const employees = await Employee.find({
      empId: { $in: employeeIds },
    })
      .select("empId name")
      .lean();

    // Build map: empId -> name
    const nameMap = new Map<string, string>();
    employees.forEach((emp: any) => {
      const key = emp.empId || emp.employeeId;
      if (key && emp.name) {
        nameMap.set(key, emp.name);
      }
    });

    // Shape data for frontend
    const recordsWithNames = records.map((r: any) => ({
      _id: r._id.toString(),
      employeeId: r.employeeId,
      employeeName: nameMap.get(r.employeeId) || null,
      date: r.date,
      punchInTime: r.punchInTime || null,
      punchOutTime: r.punchOutTime || null,
      mode: r.mode || "IN_OFFICE",

      // 👇 expose location fields so frontend can calculate distance / accuracy
      punchInLatitude: r.punchInLatitude ?? null,
      punchInLongitude: r.punchInLongitude ?? null,
      punchOutLatitude: r.punchOutLatitude ?? null,
      punchOutLongitude: r.punchOutLongitude ?? null,
    }));

    return NextResponse.json(
      { records: recordsWithNames },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error fetching attendance:", err);
    return NextResponse.json(
      { error: "Failed to fetch attendance records." },
      { status: 500 }
    );
  }
}

