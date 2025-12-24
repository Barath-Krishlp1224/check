import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // Fixed import based on your previous codes
import Employee from "@/models/Employee";

export async function GET(request: Request) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const name = url.searchParams.get("name");
    const search = url.searchParams.get("search");

    // ✅ Selection includes all fields needed for Payslips & Editing
    const selectFields =
      "_id empId name displayName department role team category salary accountNumber ifscCode joiningDate mailId";

    // 1️⃣ Partial search (name / empId)
    if (search) {
      const regex = new RegExp(search, "i");

      const employees = await Employee.find(
        {
          $or: [{ name: regex }, { empId: regex }],
        },
        selectFields
      )
        .sort({ name: 1 })
        .lean();

      return NextResponse.json({
        success: true,
        employees,
      });
    }

    // 2️⃣ Exact name match (case-insensitive)
    if (name) {
      const employee = await Employee.findOne(
        { name: { $regex: `^${name}$`, $options: "i" } },
        selectFields
      ).lean();

      if (!employee) {
        return NextResponse.json(
          { success: false, error: "Not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        employee,
      });
    }

    // 3️⃣ All employees (default / hike / payroll pages)
    const employees = await Employee.find({}, selectFields)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}