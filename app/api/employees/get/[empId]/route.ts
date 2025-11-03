// app/api/employees/get/[empId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const empId = url.pathname.split('/').pop()?.toUpperCase().trim();

    if (!empId) {
      return NextResponse.json({ success: false, message: "Employee ID is required" }, { status: 400 });
    }

    const employee = await Employee.findOne({ empId });

    if (!employee) {
      return NextResponse.json({ success: false, message: `Employee with ID ${empId} not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    console.error("Error fetching employee:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const empId = url.pathname.split('/').pop()?.toUpperCase().trim();
    const updateData = await req.json();

    if (!empId) {
      return NextResponse.json({ success: false, message: "Employee ID missing for update." }, { status: 400 });
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      { empId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return NextResponse.json({ success: false, message: `Employee ID ${empId} not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, employee: updatedEmployee });
  } catch (error: any) {
    console.error("Error updating employee:", error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return NextResponse.json({ success: false, message: `Update failed: ${duplicateField} already exists.` }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "Internal server error during update." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const empId = url.pathname.split('/').pop()?.toUpperCase().trim();

    if (!empId) {
      return NextResponse.json({ success: false, message: "Employee ID missing for deletion." }, { status: 400 });
    }

    const result = await Employee.deleteOne({ empId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: `Employee ID ${empId} not found.` }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Employee ID ${empId} deleted successfully.` });
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    return NextResponse.json({ success: false, message: "Internal server error during deletion." }, { status: 500 });
  }
}