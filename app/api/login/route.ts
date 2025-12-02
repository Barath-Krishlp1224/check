// app/api/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

// ✅ Ensure this route runs on Node.js runtime (NOT Edge)
export const runtime = "nodejs";

// ✅ Disable caching / force dynamic
export const dynamic = "force-dynamic";

// Optional: sanity check for DB env
const MONGODB_URI = process.env.MONGODB_URI;

export async function POST(req: Request) {
  try {
    if (!MONGODB_URI) {
      console.error("❌ MONGODB_URI is NOT set in environment");
      return NextResponse.json(
        { error: "Server database is not configured." },
        { status: 500 }
      );
    }

    // ✅ Connect to MongoDB
    await connectDB();

    // ✅ Parse body safely
    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      console.error("❌ Failed to parse JSON body in /api/login:", err);
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const empIdOrEmail = body?.empIdOrEmail;
    const password = body?.password;

    if (!empIdOrEmail || !password) {
      return NextResponse.json(
        { error: "Employee ID / Email and Password are required." },
        { status: 400 }
      );
    }

    const identifier = String(empIdOrEmail).trim();

    // ✅ Case-insensitive query: email OR empId
    const query =
      identifier.includes("@")
        ? { mailId: new RegExp(`^${identifier}$`, "i") }
        : { empId: new RegExp(`^${identifier}$`, "i") };

    const employee = await Employee.findOne(query);

    if (!employee) {
      console.warn("⚠️ Login failed: user not found for identifier:", identifier);
      return NextResponse.json(
        { error: "User not found with given Employee ID or Email." },
        { status: 401 }
      );
    }

    if (!employee.password) {
      console.error(
        "❌ Employee found but password field missing for empId:",
        employee.empId
      );
      return NextResponse.json(
        { error: "User does not have a password set." },
        { status: 500 }
      );
    }

    // ✅ Compare password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      console.warn("⚠️ Login failed: invalid password for empId:", employee.empId);
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 401 }
      );
    }

    // ✅ Minimal safe user object for frontend
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
    console.error("💥 Login error in /api/login:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
