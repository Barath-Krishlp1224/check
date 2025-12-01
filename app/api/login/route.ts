// app/api/login/route.ts
import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

// ✅ Ensure this route runs on Node.js runtime (NOT Edge)
export const runtime = "nodejs";

// ✅ Disable caching / force dynamic
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // ✅ Connect to MongoDB (make sure MONGODB_URI is set on Vercel)
    await connectDB();

    // ✅ Parse body
    const body = await req.json();
    const empIdOrEmail = body?.empIdOrEmail;
    const password = body?.password;

    if (!empIdOrEmail || !password) {
      return NextResponse.json(
        { error: "Employee ID / Email and Password are required." },
        { status: 400 }
      );
    }

    const identifier = String(empIdOrEmail).trim();

    // ✅ Build case-insensitive query (email or empId)
    const query =
      identifier.includes("@")
        ? { mailId: new RegExp(`^${identifier}$`, "i") }
        : { empId: new RegExp(`^${identifier}$`, "i") };

    const employee = await Employee.findOne(query);

    if (!employee) {
      return NextResponse.json(
        { error: "User not found with given Employee ID or Email." },
        { status: 401 }
      );
    }

    // ✅ Guard in case password is missing on document
    if (!employee.password) {
      console.error("Employee found but no password field:", employee.empId);
      return NextResponse.json(
        { error: "User does not have a password set." },
        { status: 500 }
      );
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 401 }
      );
    }

    // ✅ Minimal safe user object
    const user = {
      empId: employee.empId,
      name: employee.name,
      role: employee.role, // "Admin" | "Manager" | "TeamLead" | "Employee"
      team: employee.team, // "Founders" | "Manager" | "TL-Reporting Manager" | "Tech" | "Accounts" | "HR" | "Admin & Operations"
    };

    return NextResponse.json(
      {
        message: "Login successful",
        user,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error in /api/login:", error);

    // Don't leak internal details to the client
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
