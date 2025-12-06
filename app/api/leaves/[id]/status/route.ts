import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import LeaveRequest, { LeaveStatus } from "@/models/LeaveRequest";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { status }: { status: LeaveStatus } = await req.json();
    const { id } = await params; // 👈 IMPORTANT: await params

    const allowedStatuses: LeaveStatus[] = [
      "pending",
      "manager-pending",
      "approved",
      "rejected",
      "auto-approved",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid or missing status." },
        { status: 400 }
      );
    }

    const leave = await LeaveRequest.findById(id);

    if (!leave) {
      return NextResponse.json(
        { error: "Leave request not found." },
        { status: 404 }
      );
    }

    const currentStatus = leave.status as LeaveStatus;

    if (currentStatus === "pending") {
      // TL level
      if (status === "manager-pending") {
        leave.teamLeadApproved = true;
        leave.managerApproved = false;
        leave.status = "manager-pending";
      } else if (status === "rejected") {
        leave.teamLeadApproved = false;
        leave.managerApproved = false;
        leave.status = "rejected";
      } else {
        return NextResponse.json(
          {
            error:
              "For pending requests, only 'manager-pending' (TL approve) or 'rejected' (TL reject) are allowed.",
          },
          { status: 400 }
        );
      }
    } else if (currentStatus === "manager-pending") {
      // Manager level
      if (status === "approved") {
        leave.managerApproved = true;
        leave.status = "approved";
      } else if (status === "rejected") {
        leave.managerApproved = false;
        leave.status = "rejected";
      } else {
        return NextResponse.json(
          {
            error:
              "For manager-pending requests, only 'approved' or 'rejected' are allowed.",
          },
          { status: 400 }
        );
      }
    } else {
      // auto-approved / approved / rejected cannot be updated
      return NextResponse.json(
        { error: "Only pending or manager-pending requests can be updated." },
        { status: 400 }
      );
    }

    await leave.save();
    return NextResponse.json(leave, { status: 200 });
  } catch (err) {
    console.error("Error updating leave status:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
