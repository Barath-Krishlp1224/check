import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* -------------------------------------------------------------------------- */
/*                               Helper Utils                                 */
/* -------------------------------------------------------------------------- */
function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function ensureConnected() {
  await connectDB();

  let retries = 0;
  while (mongoose.connection.readyState !== 1 && retries < 15) {
    await new Promise((r) => setTimeout(r, 100));
    retries++;
  }

  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB not connected");
  }
}

/* -------------------------------------------------------------------------- */
/*                                    POST                                    */
/* -------------------------------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    await ensureConnected();

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { empIdOrEmail, password } = body;

    if (!empIdOrEmail || !password) {
      return NextResponse.json(
        { error: "Employee ID / Email and password are required" },
        { status: 400 }
      );
    }

    const input = empIdOrEmail.trim();
    const escaped = escapeRegex(input);
    const regex = new RegExp(`^${escaped}$`, "i");

    // ❗ DO NOT use lean() for auth
    const employee = await Employee.findOne({
      $or: [{ empId: regex }, { mailId: regex }],
    }).select("+password");

    if (!employee) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!employee.password) {
      return NextResponse.json(
        { error: "Password not set. Contact admin" },
        { status: 401 }
      );
    }

    let isValid = false;

    // bcrypt hash
    if (
      employee.password.startsWith("$2a$") ||
      employee.password.startsWith("$2b$")
    ) {
      isValid = await bcrypt.compare(password, employee.password);
    } else {
      // legacy plain-text password
      isValid = password === employee.password;

      if (isValid) {
        const hashed = await bcrypt.hash(password, 10);
        employee.password = hashed;
        await employee.save();
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const user = {
      id: employee._id.toString(),
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
  } catch (error: any) {
    console.error("LOGIN API ERROR:", error.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
