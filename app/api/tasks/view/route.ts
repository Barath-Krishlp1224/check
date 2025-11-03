// app/api/tasks/view/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

export const dynamic = "force-dynamic"; // ⚡ prevents static pre-rendering

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const empId = url.searchParams.get("empId")?.trim();

    await client.connect();
    const db = client.db("employeetasks");
    const collection = db.collection("employeetasks");

    const query = empId
      ? { empId: { $regex: `^${empId}$`, $options: "i" } }
      : {};

    const tasks = await collection.find(query).sort({ date: -1 }).toArray();

    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tasks" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}