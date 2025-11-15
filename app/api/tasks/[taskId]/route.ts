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
    const newStatus = body.status as string; 
    
    // 1A. Fetch the current task state to get the original status
    const existingTask = await Task.findById(taskId.trim());
    if (!existingTask) {
        return NextResponse.json(
            { success: false, error: "Task not found for status check" },
            { status: 404 }
        );
    }
    const originalStatus = existingTask.status;

    // 1. Update the task in the database
    const updatedTask = await Task.findByIdAndUpdate(
      taskId.trim(),
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, error: "Task not found after update" },
        { status: 404 }
      );
    }
    
    // 2. Conditional Slack Notification Logic for ALL statuses
    const statusesToNotify = [
        "Backlog", 
        "In Progress", 
        "Dev Review", 
        "Deployed in QA", 
        "Test In Progress", 
        "QA Sign Off", 
        "Deployment Stage", 
        "Pilot Test", 
        "Completed", 
        "Paused"
    ];

    // Only send notification if the status actually changed AND the new status is one we monitor
    if (newStatus && newStatus !== originalStatus && statusesToNotify.includes(newStatus)) {
        try {
            let statusEmoji = "🔔"; 
            if (newStatus === "Backlog") statusEmoji = "📥";
            else if (newStatus === "In Progress") statusEmoji = "▶️";
            else if (newStatus === "Paused") statusEmoji = "⏸️";
            else if (newStatus === "Dev Review") statusEmoji = "🔬";
            else if (newStatus === "Deployed in QA") statusEmoji = "📦";
            else if (newStatus === "Test In Progress") statusEmoji = "🧪";
            else if (newStatus === "QA Sign Off") statusEmoji = "📝";
            else if (newStatus === "Deployment Stage") statusEmoji = "⚙️";
            else if (newStatus === "Pilot Test") statusEmoji = "✈️";
            else if (newStatus === "Completed") statusEmoji = "✅";

            // 🆕 MODIFIED MESSAGE: Using * for bolding the originalStatus and newStatus
            const slackMessage = {
                text: `${statusEmoji} *Task Status Shifted:*\nTask *${updatedTask.projectId}* moved from *${originalStatus}* to *${newStatus}*.`,
                blocks: [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `${statusEmoji} *Task Status Shifted:*\nTask *${updatedTask.projectId}* moved from *${originalStatus}* to *${newStatus}*.`
                        }
                    },
                    {
                        "type": "divider"
                    },
                    {
                        "type": "section",
                        "fields": [
                            { "type": "mrkdwn", "text": `*Project Name:*\n${updatedTask.project}` },
                            { "type": "mrkdwn", "text": `*Assignee:*\n${updatedTask.assigneeName}` },
                            { "type": "mrkdwn", "text": `*Completion:*\n${updatedTask.completion}%` },
                            { "type": "mrkdwn", "text": `*Due Date:*\n${updatedTask.dueDate}` },
                            { "type": "mrkdwn", "text": `*Start Date:*\n${updatedTask.startDate || 'N/A'}` },
                            { "type": "mrkdwn", "text": `*End Date:*\n${updatedTask.endDate || 'N/A'}` },
                        ]
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": `*Remarks:*\n${updatedTask.remarks || 'None provided.'}`
                        }
                    }
                ]
            };

            await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(slackMessage),
            });

            console.log(`✅ Slack notification sent for status change: ${originalStatus} -> ${newStatus}`);
        } catch (slackErr) {
            console.error(`⚠️ Slack notification failed for status change ${originalStatus} -> ${newStatus}:`, slackErr);
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