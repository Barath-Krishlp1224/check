import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Asset from "@/models/Asset";
export async function GET() {
  await connectDB();
  try {
    const assets = await Asset.find({});
    return NextResponse.json({ success: true, assets }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch assets" },
      { status: 500 }
    );
  }
}