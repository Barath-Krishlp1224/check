import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id)
      return NextResponse.json({ message: "ID is required" }, { status: 400 });

    await connectDB();
    const employee = await Employee.findById(id);

    if (!employee)
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });

    return NextResponse.json(employee);
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}