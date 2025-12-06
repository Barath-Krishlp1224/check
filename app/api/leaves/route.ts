import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import LeaveRequest, { LeaveType, LeaveStatus } from "@/models/LeaveRequest";
import Employee from "@/models/Employee";

const ANNUAL_SICK_CASUAL_LIMIT = 12;

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const {
      empIdOrEmail,
      leaveType,
      startDate,
      endDate,
      days,
      description,
    }: {
      empIdOrEmail: string;
      leaveType: LeaveType;
      startDate: string;
      endDate: string;
      days: number;
      description?: string;
    } = body;

    if (!empIdOrEmail || !leaveType || !startDate || !endDate || !days) {
      return NextResponse.json(
        {
          error:
            "empIdOrEmail, leaveType, startDate, endDate, days are required",
        },
        { status: 400 }
      );
    }

    const identifier = empIdOrEmail.trim();
    const empQuery = identifier.includes("@")
      ? { mailId: new RegExp(`^${identifier}$`, "i") }
      : { empId: new RegExp(`^${identifier}$`, "i") };

    const employee = await Employee.findOne(empQuery);

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found with given Employee ID or Email." },
        { status: 404 }
      );
    }

    const finalEmployeeName = employee.name || "Unknown";
    const finalEmployeeId = employee.empId || employee._id.toString();
    const isAccountsTeam = employee.team === "Accounts";

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return NextResponse.json(
        { error: "Invalid date range" },
        { status: 400 }
      );
    }

    if (days <= 0) {
      return NextResponse.json(
        { error: "Days must be greater than 0" },
        { status: 400 }
      );
    }

    const currentYear = start.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const nextYearStart = new Date(currentYear + 1, 0, 1);

    const [approvedSick, approvedCasual] = await Promise.all([
      LeaveRequest.find({
        employeeId: finalEmployeeId,
        leaveType: "sick",
        status: { $in: ["approved", "auto-approved"] },
        startDate: { $gte: yearStart, $lt: nextYearStart },
      }),
      LeaveRequest.find({
        employeeId: finalEmployeeId,
        leaveType: "casual",
        status: { $in: ["approved", "auto-approved"] },
        startDate: { $gte: yearStart, $lt: nextYearStart },
      }),
    ]);

    const usedSick = approvedSick.reduce((sum, r) => sum + r.days, 0);
    const usedCasual = approvedCasual.reduce((sum, r) => sum + r.days, 0);

    const remainingSickBefore = ANNUAL_SICK_CASUAL_LIMIT - usedSick;
    const remainingCasualBefore = ANNUAL_SICK_CASUAL_LIMIT - usedCasual;

    let remainingSickAfter = remainingSickBefore;
    let remainingCasualAfter = remainingCasualBefore;
    
    // MODIFIED: Initial status logic
    let status: LeaveStatus = isAccountsTeam ? "manager-pending" : "pending";
    let teamLeadApproved = isAccountsTeam;

    if (leaveType === "sick") {
      if (days > remainingSickBefore) {
        return NextResponse.json(
          {
            error: `Not enough Sick Leaves. Only ${remainingSickBefore} day(s) remaining for the year (Limit: ${ANNUAL_SICK_CASUAL_LIMIT}).`,
          },
          { status: 400 }
        );
      }
      if (days === 1) {
        status = "auto-approved";
        teamLeadApproved = true;
        remainingSickAfter = remainingSickBefore - days;
      }
    }

    if (leaveType === "casual") {
      if (days > remainingCasualBefore) {
        return NextResponse.json(
          {
            error: `Not enough Casual Leaves. Only ${remainingCasualBefore} day(s) remaining for the year (Limit: ${ANNUAL_SICK_CASUAL_LIMIT}).`,
          },
          { status: 400 }
        );
      }
      if (days === 1) {
        status = "auto-approved";
        teamLeadApproved = true;
        remainingCasualAfter = remainingCasualBefore - days;
      }
    }

    const leave = await LeaveRequest.create({
      employeeName: finalEmployeeName,
      employeeId: finalEmployeeId,
      leaveType,
      startDate: start,
      endDate: end,
      days,
      description,
      status,
      teamLeadApproved: teamLeadApproved,
      managerApproved: false,
    });

    return NextResponse.json(
      {
        leave,
        remainingSick: remainingSickAfter,
        remainingCasual: remainingCasualAfter,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating leave request:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const empIdOrEmail = searchParams.get("empIdOrEmail");
    const mode = searchParams.get("mode");

    let employee = null;
    let finalEmployeeId: string | undefined;

    if (empIdOrEmail) {
      const identifier = empIdOrEmail.trim();
      const query = identifier.includes("@")
        ? { mailId: new RegExp(`^${identifier}$`, "i") }
        : { empId: new RegExp(`^${identifier}$`, "i") };

      employee = await Employee.findOne(query);

      if (employee) {
        finalEmployeeId = employee.empId || employee._id.toString();
      }
    }

    if (empIdOrEmail && mode !== "list") {
      if (!employee) {
        return NextResponse.json(
          { error: "Employee not found." },
          { status: 404 }
        );
      }

      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const nextYearStart = new Date(currentYear + 1, 0, 1);

      const [approvedSick, approvedCasual, pendingPlanned, pendingUnplanned] =
        await Promise.all([
          LeaveRequest.find({
            employeeId: finalEmployeeId,
            leaveType: "sick",
            status: { $in: ["approved", "auto-approved"] },
            startDate: { $gte: yearStart, $lt: nextYearStart },
          }),
          LeaveRequest.find({
            employeeId: finalEmployeeId,
            leaveType: "casual",
            status: { $in: ["approved", "auto-approved"] },
            startDate: { $gte: yearStart, $lt: nextYearStart },
          }),
          LeaveRequest.find({
            employeeId: finalEmployeeId,
            leaveType: "planned",
            status: "pending",
          }),
          LeaveRequest.find({
            employeeId: finalEmployeeId,
            leaveType: "unplanned",
            status: "pending",
          }),
        ]);

      const usedSick = approvedSick.reduce((sum, r) => sum + r.days, 0);
      const usedCasual = approvedCasual.reduce((sum, r) => sum + r.days, 0);
      const pendingPlannedDays = pendingPlanned.reduce(
        (sum, r) => sum + r.days,
        0
      );
      const pendingUnplannedDays = pendingUnplanned.reduce(
        (sum, r) => sum + r.days,
        0
      );

      const remainingSick = ANNUAL_SICK_CASUAL_LIMIT - usedSick;
      const remainingCasual = ANNUAL_SICK_CASUAL_LIMIT - usedCasual;

      return NextResponse.json(
        {
          sick: remainingSick,
          casual: remainingCasual,
          plannedRequests: pendingPlannedDays,
          unplannedRequests: pendingUnplannedDays,
        },
        { status: 200 }
      );
    }

    if (empIdOrEmail && mode === "list") {
      if (!employee) {
        return NextResponse.json([], { status: 200 });
      }

      const leaves = await LeaveRequest.find({
        employeeId: finalEmployeeId,
      }).sort({ createdAt: -1 });

      return NextResponse.json(leaves, { status: 200 });
    }

    const status = searchParams.get("status");
    const leaveType = searchParams.get("leaveType");
    const filterEmployeeId = searchParams.get("employeeId");
    const filterEmployeeName = searchParams.get("employeeName");
    const teamLeadApprovedFilter = searchParams.get("teamLeadApproved");

    const query: Record<string, any> = {};
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;
    if (filterEmployeeId)
      query.employeeId = new RegExp(`^${filterEmployeeId}$`, "i");
    if (filterEmployeeName)
      query.employeeName = new RegExp(`^${filterEmployeeName}$`, "i");
    if (teamLeadApprovedFilter === "true") query.teamLeadApproved = true;
    if (teamLeadApprovedFilter === "false") query.teamLeadApproved = false;

    const leaves = await LeaveRequest.find(query).sort({ createdAt: -1 });

    return NextResponse.json(leaves, { status: 200 });
  } catch (err) {
    console.error("Error fetching leave requests:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}