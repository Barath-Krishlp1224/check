import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface LoginRequestBody {
  empIdOrEmail: string;
  password: string;
}

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* -------------------------------------------------------------------------- */
/* POST                                                                       */
/* -------------------------------------------------------------------------- */

export async function POST(req: NextRequest) {
  try {
    // ✅ Single, safe connection
    await connectDB();

    let body: LoginRequestBody;

    try {
      body = (await req.json()) as LoginRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { empIdOrEmail, password } = body;

    if (!empIdOrEmail?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Employee ID / Email and password are required" },
        { status: 400 }
      );
    }

    const input = empIdOrEmail.trim();
    const regex = new RegExp(`^${escapeRegex(input)}$`, "i");

    // ❗ Never use lean() for auth
    const employee = await Employee.findOne({
      $or: [{ empId: regex }, { mailId: regex }],
    }).select("+password");

    if (!employee || !employee.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    let isValid = false;

    // bcrypt password
    if (employee.password.startsWith("$2")) {
      isValid = await bcrypt.compare(password, employee.password);
    } else {
      // legacy plain-text password
      isValid = password === employee.password;

      if (isValid) {
        employee.password = await bcrypt.hash(password, 10);
        await employee.save();
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const user = {
      id: employee._id.toString(),
      empId: employee.empId,
      name: employee.name,
      role: employee.role ?? "Employee",
      team: employee.team ?? null,
      department: employee.department ?? null,
    };

    return NextResponse.json(
      { message: "Login successful", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("LOGIN API ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
