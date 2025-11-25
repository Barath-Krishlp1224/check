// ./api/tasks/add (POST function)

import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import Employee from "@/models/Employee";

interface Subtask {
  id?: string | null;
  title: string;
  status: string;
  completion: number;
  remarks?: string;
  startDate?: string;
  dueDate?: string;
  endDate?: string;
  timeSpent?: string;
  assigneeName?: string;
  // ✨ ADDED DATE FIELD
  date?: string;
  subtasks?: Subtask[];
}

type ReqBody = {
  projectId: string;
  assigneeNames: string[]; 
  project: string;
  department: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  completion?: string | number;
  status?: string;
  remarks?: string;
  subtasks?: Subtask[]; 
};

// UPDATED: Added tl accountant to the webhook map
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
  "tl accountant": process.env.SLFLACK_WEBHOOK_URL_TLACC ?? process.env.SLACK_WEBHOOK_URL_ACC, // NEW
};

const normalizeDeptKey = (d?: string) => (d ? d.toString().trim().toLowerCase() : "");

async function postToSlack(webhookUrl: string, payload: any) {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const bodyText = await res.text().catch(() => "<no body>");
      console.warn("Slack webhook returned non-OK:", res.status, bodyText);
    }
  } catch (err) {
    console.error("Slack webhook POST failed:", err);
  }
}

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = (await req.json()) as ReqBody;
    console.log("🟡 Incoming Task Data:", body);

    const {
      projectId,
      assigneeNames, 
      project,
      department,
      startDate,
      endDate,
      dueDate,
      completion,
      status,
      remarks,
      subtasks, 
    } = body || {};

    // Basic validation
    if (!projectId || !project || !assigneeNames || assigneeNames.length === 0) { 
      return NextResponse.json(
        { success: false, error: "Missing required fields: projectId, project, or at least one assignee." },
        { status: 400 }
      );
    }

    if (!department) {
      return NextResponse.json(
        { success: false, error: "Department is required." },
        { status: 400 }
      );
    }

    const completionValue =
      completion !== "" && completion !== undefined ? Number(completion) : 0;
    const taskStatus = status || "Backlog";

    // Create and save task, using assigneeNames
    const newTask = new Task({
      assigneeNames, 
      projectId,
      project,
      department,
      startDate,
      endDate,
      dueDate,
      completion: completionValue,
      status: taskStatus,
      remarks,
      subtasks, 
    });

    const savedTask = await newTask.save();
    console.log("✅ Task saved successfully:", savedTask._id ?? savedTask);

    // Prepare Slack notification
    const primaryAssignee = assigneeNames[0];
    let assigneeLabel = primaryAssignee;
    
    // Enrich primary assignee label with empId if exists
    try {
      const emp = await Employee.findOne({ name: new RegExp(`^${primaryAssignee}$`, "i") }, "empId name").lean();
      if (emp) assigneeLabel = `${emp.name}${emp.empId ? ` (${emp.empId})` : ""}`;
    } catch (err) {
      console.warn("Primary assignee lookup failed:", err);
    }

    const totalAssignees = assigneeNames.length;
    const assigneeDisplay = totalAssignees > 1 
      ? `${assigneeLabel} (+${totalAssignees - 1} others)`
      : assigneeLabel;
    
    // Determine webhook
    const deptKey = normalizeDeptKey(department);
    // Logic handles the new key "tl accountant" being present
    const webhookUrl = DEPT_WEBHOOK_MAP[deptKey] ?? DEPT_WEBHOOK_MAP["tech"];

    if (!webhookUrl) {
      console.warn("⚠️ No Slack webhook configured for department:", department);
    } else {
      try {
        const subtaskCount = subtasks?.length || 0;
        const subtaskNote = subtaskCount > 0 ? ` (+${subtaskCount} Subtask${subtaskCount > 1 ? 's' : ''})` : '';
        
        const headline = `📌 New Task — ${department}`;
        const blocks: any[] = [
          { type: "section", text: { type: "mrkdwn", text: `*${headline}*` } },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Project:* ${project} (${projectId})${subtaskNote}\n*Assignee(s):* ${assigneeDisplay}\n*Department:* ${department}\n*Status:* ${taskStatus}${dueDate ? `\n*Due:* ${dueDate}` : ""}`, 
            },
          },
          ...(remarks ? [{ type: "section", text: { type: "mrkdwn", text: `*Remarks:* ${remarks}` } }] : []),
          { type: "context", elements: [{ type: "mrkdwn", text: `Task saved: ${savedTask._id}` }] },
        ];

        await postToSlack(webhookUrl, { blocks });

        console.log(`✅ Slack notification sent to webhook for department="${deptKey}"`);
      } catch (slackErr) {
        console.error("⚠️ Slack notification failed:", slackErr);
      }
    }

    return NextResponse.json(
      { success: true, message: "Task added successfully", task: savedTask },
      { status: 201 }
    );
  } catch (error: any) {
    let errorMessage = error.message || "Failed to add task";
    if (error.code === 11000) {
      errorMessage = "Project ID must be unique. A task with this ID already exists.";
    }
    console.error("🔥 Error adding task:", errorMessage);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}