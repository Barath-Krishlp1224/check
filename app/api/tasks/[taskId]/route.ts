import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  await connectDB();
  const { taskId } = await context.params;
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  await connectDB();
  try {
    const { taskId } = await context.params;
    const body = await req.json();

    const updatedTask = await Task.findByIdAndUpdate(
      taskId.trim(),
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  await connectDB();
  try {
    const { taskId } = await context.params;
    const deleted = await Task.findByIdAndDelete(taskId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}