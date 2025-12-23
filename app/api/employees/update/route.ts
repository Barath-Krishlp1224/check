import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updateFields } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "Employee ID is required" }, { status: 400 });
    }

    await connectDB();

    // Map Frontend names to Schema names if they differ
    const finalUpdate: any = { ...updateFields };
    
    if (updateFields.bankAccount) {
      finalUpdate.accountNumber = updateFields.bankAccount;
      delete finalUpdate.bankAccount;
    }
    
    if (updateFields.doj) {
      finalUpdate.joiningDate = updateFields.doj;
      delete finalUpdate.doj;
    }

    // Convert numeric strings to actual numbers to prevent "NaN" in DB
    const numericFields = [
      'salary', 'basic', 'hra', 'bonus', 'specialAllowance', 
      'pf', 'incomeTax', 'healthInsurance', 'professionalTax'
    ];

    numericFields.forEach(field => {
      if (finalUpdate[field] !== undefined) {
        finalUpdate[field] = Number(finalUpdate[field]) || 0;
      }
    });

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      { $set: finalUpdate },
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Employee records updated successfully",
      employee: updatedEmployee
    });

  } catch (error: any) {
    console.error("Update Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}