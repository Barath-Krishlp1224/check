import { NextResponse } from "next/server";
import dbConnection from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function GET() {
  try {
    await dbConnection();

    const [
      totalEmployees,
      foundersTeamCount,
      managerTeamCount,
      tlReportingManagerTeamCount,
      itAdminTeamCount,
      techTeamCount,
      accountsTeamCount,
      adminOpsTeamCount,
      hrTeamCount,
      housekeepingTeamCount, // <-- added
    ] = await Promise.all([
      Employee.countDocuments(),                              // total
      Employee.countDocuments({ team: "Founders" }),          // Founders
      Employee.countDocuments({ team: "Manager" }),           // Manager
      Employee.countDocuments({ team: "TL-Reporting Manager" }), // TL-Reporting Manager
      Employee.countDocuments({ team: "IT Admin" }),          // IT Admin
      Employee.countDocuments({ team: "Tech" }),              // Tech
      Employee.countDocuments({ team: "Accounts" }),          // Accounts
      Employee.countDocuments({ team: "Admin & Operations" }),// Admin & Ops
      Employee.countDocuments({ team: "HR" }),                // HR
      Employee.countDocuments({ team: "Housekeeping" }),      // Housekeeping (new)
    ]);

    return NextResponse.json({
      totalEmployees,
      foundersTeamCount,
      managerTeamCount,
      tlReportingManagerTeamCount,
      itAdminTeamCount,
      techTeamCount,
      accountsTeamCount,
      adminOpsTeamCount,
      hrTeamCount,
      housekeepingTeamCount, // <-- returned
    });
  } catch (error: any) {
    console.error("Error fetching employee stats:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
