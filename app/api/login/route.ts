import { NextResponse, NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    let body: { empIdOrEmail?: string; password?: string };

    try {
      body = await req.json();
    } catch (err) {
      console.error("Failed to parse JSON body in /api/login:", err);
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const empIdOrEmailRaw = body?.empIdOrEmail;
    const password = body?.password;

    if (!empIdOrEmailRaw || !password) {
      return NextResponse.json(
        { error: "Employee ID / Email and Password are required." },
        { status: 400 }
      );
    }

    const escaped = escapeRegex(empIdOrEmailRaw.trim());
    const regex = new RegExp(`^${escaped}$`, "i");

    const employee = await Employee.findOne({
      $or: [{ mailId: regex }, { empId: regex }],
    })
      .select("+password")
      .lean();

    if (!employee) {
      console.warn("Login failed: user not found for:", empIdOrEmailRaw);
      return NextResponse.json(
        { error: "User not found with given Employee ID or Email." },
        { status: 404 }
      );
    }

    if (
      !employee.password ||
      (typeof employee.password === "string" &&
        employee.password.trim() === "")
    ) {
      console.error(
        "Employee found but password missing for empId:",
        employee.empId
      );
      return NextResponse.json(
        {
          error:
            "User does not have a password set. Contact admin to set/reset password.",
        },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      console.warn(
        "Login failed: invalid password for empId:",
        employee.empId
      );
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 401 }
      );
    }

    const user = {
      empId: employee.empId,
      name: employee.name,
      role: employee.role || "Employee",
      team: employee.team || null,
      department: employee.department || null,
    };

    return NextResponse.json(
      { message: "Login successful", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error in /api/login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
