// app/api/employees/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee"; // adjust path as needed

export async function GET() {
  try {
    await connectDB();
    const employees = await Employee.find({}, "name").sort({ name: 1 });
    return NextResponse.json({ success: true, employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch employees" }, { status: 500 });
  }
}