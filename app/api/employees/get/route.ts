// app/api/employees/get/route.ts
import { NextResponse, NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";

/**
 * GET /api/employees/get?id=<id>
 * - Validates query param
 * - Ensures DB connection
 * - Returns employee document or appropriate error
 */
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID is required" },
        { status: 400 }
      );
    }

    // ensure DB connected (server-only)
    await connectDB();

    // make sure model is server-side only (no client imports anywhere inside model)
    const employee = await Employee.findById(id).lean();

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/employees/get error:", err);
    return NextResponse.json(
      { success: false, message: err?.message || "Server error" },
      { status: 500 }
    );
  }
}
