// app/api/assets/[id]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Asset from "@/models/Asset";

// Use RouteContext<'/api/assets/[id]'> so TypeScript knows the params shape.
// Note: await ctx.params because params may be a Promise in Next 15.
export async function PUT(
  req: NextRequest,
  ctx: RouteContext<'/api/assets/[id]'>
) {
  const { id } = await ctx.params; // id is the dynamic segment

  try {
    await connectDB();

    const body = await req.json();

    // Basic validation - adjust to your needs
    const updateData: Partial<Record<string, unknown>> = {};
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
    ] as const;

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        // TS: index signature via bracket
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
      { success: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
