// api/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

const webhookUrl = process.env.SLACK_WEBHOOK_URL!; 

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

    // 1. Update the task in the database
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
    
    // 2. Logic: Send Slack Notification for "Start Sprint" action
    // Check if the request body explicitly set status to "In Progress"
    if (body.status === "In Progress" && updatedTask.status === "In Progress") {
        try {
            const slackMessage = {
                text: `🚀 *SPRINT STARTED!* Task is now **In Progress**.\n• *ID:* ${updatedTask.projectId}\n• *Project:* ${updatedTask.project}\n• *Assignee:* ${updatedTask.assigneeName}`,
            };

            await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(slackMessage),
            });

            console.log("✅ Slack notification sent for Start Sprint!");
        } catch (slackErr) {
            console.error("⚠️ Slack notification failed for Start Sprint:", slackErr);
        }
    }
    // ----------------------------------------------------


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