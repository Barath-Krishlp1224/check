import { NextRequest, NextResponse } from "next/server";
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
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const empIdOrEmailRaw = body.empIdOrEmail?.trim();
    const password = body.password;

    if (!empIdOrEmailRaw || !password) {
      return NextResponse.json(
        { error: "Employee ID / Email and Password are required." },
        { status: 400 }
      );
    }

    const escaped = escapeRegex(empIdOrEmailRaw);
    const regex = new RegExp(`^${escaped}$`, "i");

    const employee = await Employee.findOne({
      $or: [{ mailId: regex }, { empId: regex }],
    })
      .select("+password")
      .lean();

    if (!employee) {
      return NextResponse.json(
        { error: "User not found with given Employee ID or Email." },
        { status: 404 }
      );
    }

    console.log("LOGIN DEBUG:", {
      empId: employee.empId,
      hasPassword: Boolean(employee.password),
      passwordType: typeof employee.password,
    });

    if (!employee.password) {
      return NextResponse.json(
        {
          error:
            "Account exists but password is not set. Contact admin to activate your account.",
        },
        { status: 401 }
      );
    }

    let passwordMatches = false;

    if (employee.password.startsWith("$2a$") || employee.password.startsWith("$2b$")) {
      passwordMatches = await bcrypt.compare(password, employee.password);
    } else {
      passwordMatches = password === employee.password;

      if (passwordMatches) {
        const hashed = await bcrypt.hash(password, 10);
        await Employee.updateOne(
          { _id: employee._id },
          { $set: { password: hashed } }
        );
      }
    }

    if (!passwordMatches) {
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
    console.error("LOGIN API ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
