import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { empIdOrEmail, newPassword } = await req.json();

    if (!empIdOrEmail || !newPassword) {
      return NextResponse.json(
        { error: "Employee ID or Email and new password are required." },
        { status: 400 }
      );
    }

    // Identify whether user entered email or empId
    const identifier = empIdOrEmail.trim();
    const query = identifier.includes("@")
      ? { mailId: new RegExp(`^${identifier}$`, "i") }
      : { empId: new RegExp(`^${identifier}$`, "i") };

    // Check employee exists
    const employee = await Employee.findOne(query);
    if (!employee) {
      return NextResponse.json(
        { error: "No employee found." },
        { status: 404 }
      );
    }

    // Hash new password securely
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
    employee.password = hashedPassword;
    await employee.save();

    return NextResponse.json({
      success: true,
      message: "Password updated successfully!"
    });
  } catch (err: any) {
    console.error("Password reset error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
