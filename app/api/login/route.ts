import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function POST(req: Request) {
  try {
    const { empIdOrEmail, password } = await req.json();

    if (!empIdOrEmail || !password) {
      return NextResponse.json(
        { error: "Employee ID/Email and password are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const identifier = empIdOrEmail.toString().trim();

    // 🔍 Always search BOTH fields with case-insensitive regex
    const regex = new RegExp(`^${identifier}$`, "i");

    const employee = await Employee.findOne({
      $or: [{ empId: regex }, { mailId: regex }],
    });

    if (!employee) {
      console.log("Login failed: no employee for identifier:", identifier);
      return NextResponse.json(
        { error: "User not found with given Employee ID or Email." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      console.log("Login failed: invalid password for:", identifier);
      return NextResponse.json(
        { error: "Invalid password." },
        { status: 401 }
      );
    }

    // ✅ Success
    return NextResponse.json({
      message: "Login successful.",
      user: {
        empId: employee.empId,
        name: employee.name,
        role: employee.role || "Employee",
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
