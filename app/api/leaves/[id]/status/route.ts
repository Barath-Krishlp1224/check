import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import LeaveRequest, { LeaveStatus } from "@/models/LeaveRequest";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const { status }: { status: LeaveStatus } = await req.json();

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Only 'approved' or 'rejected' are allowed here." },
        { status: 400 }
      );
    }

    const leave = await LeaveRequest.findById(params.id);

    if (!leave) {
      return NextResponse.json(
        { error: "Leave request not found." },
        { status: 404 }
      );
    }

    if (leave.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending requests can be updated." },
        { status: 400 }
      );
    }

    leave.status = status;
    await leave.save();

    return NextResponse.json(leave, { status: 200 });
  } catch (err) {
    console.error("Error updating leave status:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}