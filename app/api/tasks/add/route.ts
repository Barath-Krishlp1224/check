import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import Employee from "@/models/Employee";

const DEPT_WEBHOOK_MAP: Record<string, string | undefined> = {
  tech: process.env.SLACK_WEBHOOK_URL,
  accounts: process.env.SLACK_WEBHOOK_URL_ACC,
  "it admin": process.env.SLACK_WEBHOOK_URL_ITADMIN ?? process.env.SLACK_WEBHOOK_URL,
  manager: process.env.SLACK_WEBHOOK_URL_MANAGER ?? process.env.SLACK_WEBHOOK_URL,
  "admin & operations": process.env.SLACK_WEBHOOK_URL_ADMINOPS ?? process.env.SLACK_WEBHOOK_URL,
  hr: process.env.SLACK_WEBHOOK_URL_HR ?? process.env.SLACK_WEBHOOK_URL,
  founders: process.env.SLACK_WEBHOOK_URL_FOUNDERS ?? process.env.SLACK_WEBHOOK_URL,
};

const normalizeDeptKey = (d?: string) => (d ? d.toString().trim().toLowerCase() : "");

async function postToSlack(webhookUrl: string, payload: any) {
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Slack Notification Failed:", err);
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();

    // DROP THE UNIQUE INDEX FIX
    try {
      const collection = Task.collection;
      await collection.dropIndex("projectId_1");
    } catch (e) {}

    if (!body.projectId || !body.taskId || !body.projectName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newTask = new Task({
      projectId: body.projectId,
      taskId: body.taskId,
      project: body.projectName,
      assigneeNames: body.assigneeNames,
      department: body.department,
      startDate: body.startDate,
      endDate: body.endDate,
      dueDate: body.dueDate,
      completion: body.completion !== "" ? Number(body.completion) : 0,
      status: body.status || "Backlog",
      remarks: body.remarks,
      subtasks: body.subtasks || [],
      taskStoryPoints: Number(body.storyPoints) || 0,
    });

    const savedTask = await newTask.save();

    // Slack Logic
    const deptKey = normalizeDeptKey(body.department);
    const webhookUrl = DEPT_WEBHOOK_MAP[deptKey] ?? DEPT_WEBHOOK_MAP["tech"];

    if (webhookUrl) {
      const blocks = [
        { type: "section", text: { type: "mrkdwn", text: `🚀 *New Task Created*\n*Project:* ${body.projectName}` } },
        { type: "section", text: { type: "mrkdwn", text: `👤 *Assignee:* ${body.assigneeNames[0]}\n📅 *Deadline:* ${body.dueDate || 'N/A'}` } }
      ];
      await postToSlack(webhookUrl, { blocks });
    }

    return NextResponse.json(savedTask, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}