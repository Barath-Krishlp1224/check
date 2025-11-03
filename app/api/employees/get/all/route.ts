import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function GET() {
  try {
    await connectDB();
    const employees = await Employee.find({});
    return NextResponse.json({ success: true, employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ success: false, message: "Error fetching employees" });
  }
}