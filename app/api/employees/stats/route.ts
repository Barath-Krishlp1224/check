import { NextResponse } from "next/server";
import dbConnection from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function GET() {
  try {
    await dbConnection();

    const [
      totalEmployees,
      techTeamCount,
      accountsTeamCount,
      adminOpsTeamCount,
      hrTeamCount 
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ team: "Tech" }),
      Employee.countDocuments({ team: "Accounts" }),
      // CORRECTED: Use the exact string "Admin & Operations" as defined in the schema/frontend
      Employee.countDocuments({ team: "Admin & Operations" }), 
      // CORRECTED: Use the exact string "HR"
      Employee.countDocuments({ team: "HR" }) 
    ]);

    return NextResponse.json({
      totalEmployees,
      techTeamCount,
      accountsTeamCount,
      adminOpsTeamCount,
      hrTeamCount,
    });
  } catch (error: any) {
    console.error("Error fetching employee stats:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
} 