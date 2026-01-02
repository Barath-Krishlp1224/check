import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

/**
 * Department -> Slack webhook mapping
 */
const DEPT_WEBHOOK_MAP: Record<string, string | undefined> = {
  tech: process.env.SLACK_WEBHOOK_URL,
  accounts: process.env.SLACK_WEBHOOK_URL_ACC,
  "it admin": process.env.SLACK_WEBHOOK_URL_ITADMIN ?? process.env.SLACK_WEBHOOK_URL,
  manager: process.env.SLACK_WEBHOOK_URL_MANAGER ?? process.env.SLACK_WEBHOOK_URL,
  "admin & operations": process.env.SLACK_WEBHOOK_URL_ADMINOPS ?? process.env.SLACK_WEBHOOK_URL,
  admin: process.env.SLACK_WEBHOOK_URL_ADMINOPS ?? process.env.SLACK_WEBHOOK_URL,
  hr: process.env.SLACK_WEBHOOK_URL_HR ?? process.env.SLACK_WEBHOOK_URL,
  founders: process.env.SLACK_WEBHOOK_URL_FOUNDERS ?? process.env.SLACK_WEBHOOK_URL,
  "tl-reporting manager": process.env.SLACK_WEBHOOK_URL_TL ?? process.env.SLACK_WEBHOOK_URL,
};

const STATUSES_TO_NOTIFY = [
  "Backlog",
  "In Progress",
  "Dev Review",
  "Deployed in QA",
  "Test In Progress",
  "QA Sign Off",
  "Deployment Stage",
  "Pilot Test",
  "Completed",
  "Paused",
];

function normalizeDeptKey(d?: string) {
  return (d || "").toString().trim().toLowerCase();
}

async function postToSlack(webhookUrl: string, payload: any) {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "<no body>");
      console.warn("Slack webhook responded with non-OK:", res.status, text);
    }
  } catch (err) {
    console.error("Slack webhook POST failed:", err);
  }
}

/**
 * GET -> fetch single task by id
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  await connectDB();
  try {
    const { taskId } = await context.params;
    const id = (taskId || "").trim();
    if (!id)
      return NextResponse.json(
        { success: false, error: "taskId required" },
        { status: 400 }
      );

    const task: any = await Task.findById(id).lean();
    if (!task)
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );

    return NextResponse.json({ success: true, task });
  } catch (error: any) {
    console.error("GET /api/tasks/[taskId] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT -> update task; notify Slack when status changes
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  await connectDB();
  try {
    const { taskId } = await context.params;
    const id = (taskId || "").trim();
    if (!id)
      return NextResponse.json(
        { success: false, error: "taskId required" },
        { status: 400 }
      );

    const body = await req.json();
    const newStatus =
      typeof body.status === "string" ? body.status.trim() : undefined;

    const existingTask: any = await Task.findById(id).lean();
    if (!existingTask)
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );

    const originalStatus = existingTask.status;
    const originalDept = existingTask.department ?? existingTask.team ?? "";

    const updatedTask: any = await Task.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    ).lean();

    if (!updatedTask)
      return NextResponse.json(
        { success: false, error: "Task not found after update" },
        { status: 404 }
      );

    // SLACK NOTIFICATION LOGIC
    if (
      newStatus &&
      newStatus !== originalStatus &&
      STATUSES_TO_NOTIFY.includes(newStatus)
    ) {
      try {
        const statusEmoji =
          newStatus === "Backlog" ? "📥" :
          newStatus === "In Progress" ? "▶️" :
          newStatus === "Paused" ? "⏸️" :
          newStatus === "Dev Review" ? "🔬" :
          newStatus === "Deployed in QA" ? "📦" :
          newStatus === "Test In Progress" ? "🧪" :
          newStatus === "QA Sign Off" ? "📝" :
          newStatus === "Deployment Stage" ? "⚙️" :
          newStatus === "Pilot Test" ? "✈️" :
          newStatus === "Completed" ? "✅" : "🔔";

        // Extract primary name for the big header
        const primaryAssignee = updatedTask.assigneeNames?.[0] ?? "Team Member";
        
        // Header with Name first
        const headline = `${statusEmoji} ${primaryAssignee} shifted the task status`;
        const projectLine = `Task: ${updatedTask.project ?? "—"} (${updatedTask.projectId ?? "—"})`;
        const statusLine = `Status Change: ${originalStatus ?? "—"} → ${newStatus}`;

        const fields = [
          {
            type: "mrkdwn",
            text: `Completion:\n${updatedTask.completion ?? 0}%`,
          },
          {
            type: "mrkdwn",
            text: `Story Points:\n${updatedTask.taskStoryPoints ?? 0}`,
          },
          {
            type: "mrkdwn",
            text: `Time Spent:\n${updatedTask.taskTimeSpent ?? "N/A"}`,
          },
          {
            type: "mrkdwn",
            text: `Due Date:\n${updatedTask.dueDate ?? "N/A"}`,
          },
          {
            type: "mrkdwn",
            text: `Start Date:\n${updatedTask.startDate ?? "N/A"}`,
          },
          {
            type: "mrkdwn",
            text: `All Assignees:\n${updatedTask.assigneeNames?.join(", ") ?? "—"}`,
          },
        ];

        const blocks: any[] = [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${headline}\n${projectLine}\n${statusLine}`,
            },
          },
          { type: "divider" },
          { type: "section", fields },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `Remarks:\n${updatedTask.remarks ?? "None provided."}`,
            },
          },
        ];

        const deptKey = normalizeDeptKey(updatedTask.department ?? updatedTask.team ?? originalDept);
        const webhook = DEPT_WEBHOOK_MAP[deptKey] ?? DEPT_WEBHOOK_MAP["tech"];

        if (webhook) {
          await postToSlack(webhook, { blocks });
        }
      } catch (slackErr) {
        console.error("Slack notification error:", slackErr);
      }
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error("PUT /api/tasks/[taskId] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update task" },
      { status: 500 }
    );
  }
}

/**
 * DELETE -> delete a task
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  await connectDB();
  try {
    const { taskId } = await context.params;
    const id = (taskId || "").trim();
    if (!id)
      return NextResponse.json(
        { success: false, error: "taskId required" },
        { status: 400 }
      );

    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted)
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );

    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error: any) {
    console.error("DELETE /api/tasks/[taskId] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete task" },
      { status: 500 }
    );
  }
}