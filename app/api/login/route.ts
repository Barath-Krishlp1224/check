// app/api/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

// ✅ Ensure this route runs on Node.js runtime (not Edge)
export const runtime = "nodejs";

// (Optional but sometimes useful to avoid caching issues)
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // ✅ Connect to MongoDB (make sure MONGODB_URI is set on Vercel)
    await connectDB();

    // ✅ Parse body
    const { empIdOrEmail, password } = await req.json();

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
    console.error("Login error:", error);

    // Hide internal details from client, but log them above
    const message =
      typeof error?.message === "string"
        ? error.message
        : "Internal server error";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
