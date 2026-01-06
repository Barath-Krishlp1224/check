import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const assigneeName = searchParams.get("assigneeName");

    let query: any = {};
    if (projectId) query.projectId = projectId; 
    if (assigneeName) {
      query.assigneeNames = { $regex: new RegExp(assigneeName, 'i') };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return NextResponse.json(tasks); // Matching your frontend expectations
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}