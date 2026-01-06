import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    // If projectId is provided, filter; otherwise return all
    const query = projectId ? { projectId } : {};
    const tasks = await Task.find(query).sort({ backlogOrder: 1, createdAt: -1 });
    
    return NextResponse.json(tasks, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}