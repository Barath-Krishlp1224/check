import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/connectDB";  // ✅ Use your actual DB connection file

interface DeleteBody {
  id: string;
}

// ✅ Define a reusable Mongoose model for Employee
const EmployeeSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
});

// ✅ Prevent model overwrite error in Next.js hot reload
const Employee =
  mongoose.models.Employee || mongoose.model("Employee", EmployeeSchema);

export async function DELETE(req: NextRequest) {
  try {
    await connectDB(); // ✅ ensure MongoDB connection

    const body: DeleteBody = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Employee ID is required" },
        { status: 400 }
      );
    }

    const result = await Employee.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Employee deleted successfully" });
  } catch (err: any) {
    console.error("Error deleting employee:", err);
    return NextResponse.json(
      { success: false, message: "Server error: " + err.message },
      { status: 500 }
    );
  }
}