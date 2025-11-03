import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function PUT(req: Request) {
  try {
    const { id, name, email, role } = await req.json();
    if (!id) return NextResponse.json({ message: "ID required" }, { status: 400 });

    await connectDB();
    const employee = await Employee.findByIdAndUpdate(
      id,
      { name, email, role },
      { new: true }
    );

    if (!employee) return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    return NextResponse.json({ success: true, employee });
  } catch (err: any) {
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}