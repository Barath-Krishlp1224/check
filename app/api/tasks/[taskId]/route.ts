import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

const DEPT_WEBHOOK_MAP: Record<string, string | undefined> = {
  tech: process.env.SLACK_WEBHOOK_URL,
  accounts: process.env.SLACK_WEBHOOK_URL_ACC,
  "it admin": process.env.SLACK_WEBHOOK_URL_ITADMIN ?? process.env.SLACK_WEBHOOK_URL,
  manager: process.env.SLACK_WEBHOOK_URL_MANAGER ?? process.env.SLACK_WEBHOOK_URL,
  "admin & operations": process.env.SLACK_WEBHOOK_URL_ADMINOPS ?? process.env.SLACK_WEBHOOK_URL,
  hr: process.env.SLACK_WEBHOOK_URL_HR ?? process.env.SLACK_WEBHOOK_URL,
  founders: process.env.SLACK_WEBHOOK_URL_FOUNDERS ?? process.env.SLACK_WEBHOOK_URL,
};

async function postToSlack(webhookUrl: string, payload: any) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {}
}

export async function PUT(req: NextRequest, context: { params: Promise<{ taskId: string }> }) {
  await connectDB();
  try {
    const { taskId } = await context.params;
    const body = await req.json();
    const existingTask: any = await Task.findById(taskId).lean();

    if (!existingTask) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updatedTask: any = await Task.findByIdAndUpdate(taskId, { $set: body }, { new: true }).lean();

    // Status Change Slack Alert
    if (body.status && body.status !== existingTask.status) {
      const webhook = DEPT_WEBHOOK_MAP[(updatedTask.department || "").toLowerCase()] ?? DEPT_WEBHOOK_MAP["tech"];
      if (webhook) {
        const blocks = [
          { type: "section", text: { type: "mrkdwn", text: `🔔 *Status Changed*\n*Task:* ${updatedTask.taskId}\n*New Status:* ${body.status}` } }
        ];
        await postToSlack(webhook, { blocks });
      }
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ taskId: string }> }) {
  await connectDB();
  try {
    const { taskId } = await context.params;
    await Task.findByIdAndDelete(taskId);
    return NextResponse.json({ success: true, message: "Task deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}