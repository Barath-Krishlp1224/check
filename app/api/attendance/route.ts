import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";

/* -------------------------------------------------------------------------- */
/*                                    GET                                     */
/* -------------------------------------------------------------------------- */
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const empId = searchParams.get("empId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const days = searchParams.get("days");

    const dateFilter: any = {};

    if (empId) {
      dateFilter.employeeId = empId;
    }

    if (from && to) {
      dateFilter.date = { $gte: from, $lte: to };
    } else if (days) {
      const daysNum = Number(days);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysNum);
      dateFilter.date = {
        $gte: cutoff.toISOString().split("T")[0],
      };
    }

    const records = await Attendance.find(
      dateFilter,
      {
        employeeId: 1,
        date: 1,
        punchInTime: 1,
        punchOutTime: 1,
        mode: 1,
      }
    ).lean();

    const attendances = records.map((r: any) => ({
      employeeId: String(r.employeeId),
      date: r.date,
      present: Boolean(r.punchInTime),
      punchInTime: r.punchInTime ?? null,
      punchOutTime: r.punchOutTime ?? null,
      mode: r.mode ?? "IN_OFFICE",
    }));

    return NextResponse.json({
      attendances,
      presentCount: attendances.filter(a => a.present).length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch attendance", details: err.message },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */
export async function POST(req: Request) {
  try {
    await connectDB();

    const {
      employeeId,
      punchType,
      mode = "IN_OFFICE",
      latitude,
      longitude,
      imageData,
    } = await req.json();

    if (!employeeId || !punchType) {
      return NextResponse.json(
        { error: "employeeId and punchType are required" },
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
      attendance.punchInLatitude = latitude;
      attendance.punchInLongitude = longitude;
      attendance.punchInImage = imageData;
    }

    if (punchType === "OUT") {
      attendance.punchOutTime = new Date();
      attendance.punchOutLatitude = latitude;
      attendance.punchOutLongitude = longitude;
      attendance.punchOutImage = imageData;
    }

    await attendance.save();

    return NextResponse.json({
      success: true,
      data: attendance,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Attendance save failed", details: err.message },
      { status: 500 }
    );
  }
}
