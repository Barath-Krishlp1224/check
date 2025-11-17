// app/api/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { empIdOrEmail, password } = await req.json();

    if (!empIdOrEmail || !password) {
      return NextResponse.json(
        { error: "Employee ID / Email and Password are required." },
        { status: 400 }
      );
    }

    const identifier = empIdOrEmail.trim();

    // Find by empId or mailId (case-insensitive)
    const query = identifier.includes("@")
      ? { mailId: new RegExp(`^${identifier}$`, "i") }
      : { empId: new RegExp(`^${identifier}$`, "i") };

    const employee = await Employee.findOne(query);

    if (!employee) {
      return NextResponse.json(
        { error: "User not found with given Employee ID or Email." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 401 }
      );
    }

    // Success → return minimal safe user object
    const user = {
      empId: employee.empId,
      name: employee.name,
      role: employee.role,      // "Admin" | "Manager" | "TeamLead" | "Employee"
      team: employee.team,      // "Founders" | "Manager" | "TL-Reporting Manager" | "Tech" | "Accounts" | "HR" | "Admin & Operations"
    };

    return NextResponse.json(
      {
        message: "Login successful",
        user,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
