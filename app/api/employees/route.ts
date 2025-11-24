// ./api/employees (GET function)

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const name = url.searchParams.get("name");
    if (name) {
      const employee = await Employee.findOne(
        { name: { $regex: `^${name}$`, $options: "i" } },
        "name department role"
      ).lean();
      if (!employee) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      return NextResponse.json({ success: true, employee });
    } else {
      const employees = await Employee.find({}, "name department role").sort({ name: 1 }).lean();
      return NextResponse.json({ success: true, employees });
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch employees" }, { status: 500 });
  }
}