import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTodayDateOnly() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: "Employee ID required" }, { status: 400 });
    }

    const today = getTodayDateOnly();

    const record = await Attendance.findOne({
      employeeId,
      date: today,
    });

    return NextResponse.json({ record }, { status: 200 });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}
