import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

export async function GET(req: NextRequest) {
  await connectDB();
  
  try {
    const url = new URL(req.url);
    // Retrieve the assigneeName query parameter
    const assigneeName = url.searchParams.get("assigneeName");

    let query = {};
    if (assigneeName) {
      // FIX: Filter by checking if the assigneeName (case-insensitive) is present 
      // in the assigneeNames array.
      query = { 
        assigneeNames: { 
          $regex: new RegExp(assigneeName, 'i') 
        } 
      };
    } 

    const tasks = await Task.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const data = await req.json();
    const newTask = new Task(data);
    await newTask.save();
    return NextResponse.json({ success: true, task: newTask });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}