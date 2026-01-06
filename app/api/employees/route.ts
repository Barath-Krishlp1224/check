import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function GET(request: Request) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const name = url.searchParams.get("name");
    const search = url.searchParams.get("search");
    const checkBirthdays = url.searchParams.get("birthdays");

    // Unified field selection for payroll, profile, and task assignment
    const selectFields =
      "_id empId name displayName department role team category salary accountNumber ifscCode joiningDate mailId dateOfBirth photo";

    /* ------------------------------------------------------------------
       1️⃣ Birthday check ( ?birthdays=true )
       ------------------------------------------------------------------ */
    if (checkBirthdays === "true") {
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      const todaySuffix = `-${month}-${day}`;

      const birthdayFolks = await Employee.find(
        { dateOfBirth: { $regex: todaySuffix + "$" } },
        "name displayName photo team"
      ).lean();

      return NextResponse.json({
        success: true,
        birthdays: birthdayFolks,
      });
    }

    /* ------------------------------------------------------------------
       2️⃣ Partial search ( ?search= )
       ------------------------------------------------------------------ */
    if (search) {
      const regex = new RegExp(search, "i");
      const employees = await Employee.find(
        { $or: [{ name: regex }, { empId: regex }] },
        selectFields
      )
        .sort({ name: 1 })
        .lean();

      return NextResponse.json({ success: true, employees });
    }

    /* ------------------------------------------------------------------
       3️⃣ Exact name match ( ?name= )
       ------------------------------------------------------------------ */
    if (name) {
      const employee = await Employee.findOne(
        { name: { $regex: `^${name}$`, $options: "i" } },
        selectFields
      ).lean();

      if (!employee) {
        return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, employee });
    }

    /* ------------------------------------------------------------------
       4️⃣ Default: fetch all employees
       ------------------------------------------------------------------ */
    const employees = await Employee.find({}, selectFields)
      .sort({ name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
  }
}