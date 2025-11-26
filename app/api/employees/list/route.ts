// app/api/employees/list/route.ts

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function GET(req: Request) {
  await connectDB();
  try {
    // Optionally, you could parse query parameters here to implement server-side filtering
    // const { searchParams } = new URL(req.url);
    // const team = searchParams.get("team");
    // const department = searchParams.get("department");

    const employees = await Employee.find(
      {},
      // Select only the fields needed for the directory table
      "empId name team department mailId phoneNumber joiningDate photo aadharDoc panDoc provisionalCertificate experienceCertificate"
    ).lean();

    return NextResponse.json({ success: true, employees }, { status: 200 });
  } catch (err: any) {
    console.error("GET /employees/list error:", err?.stack || err?.message || err);
    const message = err?.message || "Server error while fetching employee list";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}