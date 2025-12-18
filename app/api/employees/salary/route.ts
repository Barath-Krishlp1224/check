import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const { id, salary } = await req.json();

    if (!id || salary === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing id or salary" },
        { status: 400 }
      );
    }

    const updated = await Employee.findByIdAndUpdate(
      id,
      { salary: Number(salary) },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employee: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
