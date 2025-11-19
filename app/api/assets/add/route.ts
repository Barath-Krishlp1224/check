import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Asset from "@/models/Asset";
type ReqBody = {
  name: string;
  empId: string;
  selectedTeamCategory?: string;
  team?: string;
  designation?: string;
  deviceType?: string;
  laptopModel?: string;
  serialNumber?: string;
  yearOfMake?: string;
  macAddress?: string;
  processor?: string;
  storage?: string;
  ram?: string;
  os?: string;
  antivirus?: string;
  purchaseDate?: string;
  standardAccessories?: string[];
  otherAccessoriesText?: string;
};
export async function POST(req: Request) {
  await connectDB();
  try {
    const body = (await req.json()) as ReqBody;
    if (!body.name || !body.empId) {
      return NextResponse.json(
        { success: false, error: "name and empId are required." },
        { status: 400 }
      );
    }
    const standard = Array.isArray(body.standardAccessories)
      ? body.standardAccessories
      : [];
    const typed =
      typeof body.otherAccessoriesText === "string" && body.otherAccessoriesText.trim()
        ? body.otherAccessoriesText
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    const allAccessories = [...standard, ...typed];
    const assetDoc = new Asset({
      name: body.name,
      empId: body.empId,
      selectedTeamCategory: body.selectedTeamCategory || "",
      team: body.team || "",
      designation: body.designation || "",
      deviceType: body.deviceType || "",
      laptopModel: body.laptopModel || "",
      serialNumber: body.serialNumber || "",
      yearOfMake: body.yearOfMake || "",
      macAddress: body.macAddress || "",
      processor: body.processor || "",
      storage: body.storage || "",
      ram: body.ram || "",
      os: body.os || "",
      antivirus: body.antivirus || "",
      purchaseDate: body.purchaseDate || "",
      standardAccessories: standard,
      otherAccessoriesText: body.otherAccessoriesText || "",
      allAccessories,
    });
    const saved = await assetDoc.save();
    return NextResponse.json({ success: true, asset: saved }, { status: 201 });
  } catch (err: any) {
    console.error("Error saving asset:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to save asset" },
      { status: 500 }
    );
  }
}