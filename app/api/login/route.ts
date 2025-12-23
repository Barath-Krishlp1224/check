import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// FIX: Type the parameter correctly
function escapeRegex(input: string = "") {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(req: NextRequest) {
  try {
    // Ensure DB connection (Vercel-safe)
    await connectDB();

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body." },
        { status: 400 }
      );
    }

    const { empIdOrEmail, password } = body;

    if (!empIdOrEmail?.trim() || !password) {
      return NextResponse.json(
        { error: "Employee ID / Email and Password are required." },
        { status: 400 }
      );
    }

    const escaped = escapeRegex(empIdOrEmail.trim());
    const regex = new RegExp(`^${escaped}$`, "i");

    // FIX: No .exec() after lean()
    const employee = await Employee.findOne({
      $or: [{ mailId: regex }, { empId: regex }],
    })
      .select("+password")
      .lean();

    if (!employee) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    if (!employee.password) {
      return NextResponse.json(
        { error: "Password is not set. Contact admin." },
        { status: 401 }
      );
    }

    let passwordMatches = false;

    // If already bcrypt hashed password
    if (employee.password.startsWith("$2a$") || employee.password.startsWith("$2b$")) {
      passwordMatches = await bcrypt.compare(password, employee.password);
    } else {
      // Plain password → hash it now
      passwordMatches = password === employee.password;

      if (passwordMatches) {
        const hashed = await bcrypt.hash(password, 10);

        // FIX: ObjectId safe update
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
