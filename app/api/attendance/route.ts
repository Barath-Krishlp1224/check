import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const days = searchParams.get("days");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let dateFilter: any = {};

    if (from && to) {
      dateFilter = {
        date: { $gte: from, $lte: to },
      };
    } else if (days) {
      const daysNum = parseInt(days);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysNum);
      const cutoffDateStr = cutoffDate.toISOString().split("T")[0];
      dateFilter = { date: { $gte: cutoffDateStr } };
    }

    const records = await Attendance.find(dateFilter, {
      employeeId: 1,
      date: 1,
      punchInTime: 1,
    }).lean();

    const attendances = records.map((r) => ({
      employeeId: String(r.employeeId),
      present: Boolean(r.punchInTime),
      date: r.date,
    }));

    return NextResponse.json({ attendances });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to fetch attendance", details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    const {
      employeeId,
      punchType,
      mode = "IN_OFFICE",
      latitude,
      longitude,
      imageData
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
      attendance.punchInLatitude = latitude;
      attendance.punchInLongitude = longitude;
      attendance.punchInImage = imageData; 
    } else if (punchType === "OUT") {
      attendance.punchOutTime = new Date();
      attendance.punchOutLatitude = latitude;
      attendance.punchOutLongitude = longitude;
      attendance.punchOutImage = imageData;
    }

    await attendance.save();

    return NextResponse.json({ success: true, data: attendance });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Attendance save failed", details: err.message },
      { status: 500 }
    );
  }
}