// ./api/employees (GET function)

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const name = url.searchParams.get("name");   // exact match (old flow)
    const search = url.searchParams.get("search"); // partial match (new flow)

    // Fields required by frontend
    const selectFields =
      "name department role empId team category departmentName department_name";

    // ✅ 1) Partial search (for suggestions / filtering)
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

      return NextResponse.json({ success: true, employees });
    }

    // ✅ 2) Single employee by exact name (existing behaviour)
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
      return NextResponse.json({ success: true, employee });
    }

    // ✅ 3) Default: return all employees (for dropdown list)
    const employees = await Employee.find({}, selectFields)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({ success: true, employees });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch employees" },
      { status: 500 }
    );
  }
}
