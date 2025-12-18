import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance, { AttendanceMode } from "@/models/Attendance";

/* ---------------- GET (for hike calculation with date filtering) ---------------- */

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const days = searchParams.get("days");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let dateFilter: any = {};

    if (from && to) {
      // Custom date range
      dateFilter = {
        date: {
          $gte: from,
          $lte: to,
        },
      };
    } else if (days) {
      // Days filter (e.g., last 90, 180, 365 days)
      const daysNum = parseInt(days);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysNum);
      const cutoffDateStr = cutoffDate.toISOString().split("T")[0];
      
      dateFilter = {
        date: { $gte: cutoffDateStr },
      };
    }

    const records = await Attendance.find(
      dateFilter,
      {
        employeeId: 1,
        date: 1,
        punchInTime: 1,
      }
    ).lean();

    const attendances = records.map((r) => ({
      employeeId: String(r.employeeId), // Ensure it's a string
      present: Boolean(r.punchInTime),
      date: r.date,
    }));

    console.log(`Attendance API: Returning ${attendances.length} records`);
    console.log("Sample attendance:", attendances.slice(0, 2));

    return NextResponse.json({ attendances });
  } catch (err: any) {
    console.error("Attendance API Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch attendance", details: err.message },
      { status: 500 }
    );
  }
}

/* ---------------- POST (unchanged punch logic) ---------------- */

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      employeeId,
      punchType,
      mode = "IN_OFFICE",
    } = body;

    if (!employeeId || !punchType) {
      return NextResponse.json(
        { error: "employeeId and punchType required" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];

    let attendance = await Attendance.findOne({
      employeeId,
      date: today,
      mode,
    });

    if (!attendance) {
      attendance = new Attendance({
        employeeId,
        date: today,
        mode,
      });
    }

    if (punchType === "IN") {
      attendance.punchInTime = new Date();
    }

    if (punchType === "OUT") {
      attendance.punchOutTime = new Date();
    }

    await attendance.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Attendance save failed", details: err.message },
      { status: 500 }
    );
  }
}