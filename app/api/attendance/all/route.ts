import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee"; // 👈 make sure this path is correct

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // Get all attendance records (newest first)
    const records = await Attendance.find({})
      .sort({ date: -1 })
      .lean();

    // Collect unique employeeIds from attendance
    const employeeIds = Array.from(
      new Set(records.map((r: any) => r.employeeId))
    );

    // Fetch matching employees (assuming Employee has empId + name)
    const employees = await Employee.find({
      empId: { $in: employeeIds },
    })
      .select("empId name") // adjust fields as per your schema
      .lean();

    // Build map from empId -> name
    const nameMap = new Map<string, string>();
    employees.forEach((emp: any) => {
      if (emp.empId && emp.name) {
        nameMap.set(emp.empId, emp.name);
      }
    });

    // Attach employeeName to each attendance record
    const recordsWithNames = records.map((r: any) => ({
      _id: r._id.toString(),
      employeeId: r.employeeId,
      employeeName: nameMap.get(r.employeeId) || null, // 👈 this is what frontend uses
      date: r.date,
      punchInTime: r.punchInTime || null,
      punchOutTime: r.punchOutTime || null,
    }));

    return NextResponse.json(
      { records: recordsWithNames },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching attendance:", err);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
