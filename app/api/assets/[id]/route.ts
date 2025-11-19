// app/api/assets/[id]/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Asset from "@/models/Asset";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    await connectDB();

    const body = await req.json();

    // Basic validation - adjust to your needs
    const updateData: Partial<any> = {};
    const allowed = [
      "name",
      "empId",
      "selectedTeamCategory",
      "team",
      "designation",
      "deviceType",
      "laptopModel",
      "serialNumber",
      "processor",
      "storage",
      "ram",
      "os",
      "antivirus",
      "purchaseDate",
      "allAccessories",
    ];
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updateData[key] = body[key];
      }
    }

    const asset = await Asset.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!asset) {
      return NextResponse.json(
        { success: false, error: "Asset not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, asset }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/assets/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
