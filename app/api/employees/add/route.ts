import { NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";

import Task from "@/models/Task";

import Employee from "@/models/Employee";

type ReqBody = {
  projectId: string;
  assigneeName: string;
  project: string;
  department: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  completion?: string | number;
  status?: string;
  remarks?: string;
};

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
      assigneeName,
      project,
      department,
      startDate,
      endDate,
      dueDate,
      completion,
      status,
      remarks,
    } = body || {};

    if (!assigneeName || !projectId || !project) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: assigneeName, projectId, project" },
        { status: 400 }
      );
    }

    if (!department) {
      return NextResponse.json(
        { success: false, error: "Department is required." },
        { status: 400 }
      );
    }

    let departmentForSave = department;
    try {
      const enumVals: string[] = ((Task.schema.path("department") as any)?.enumValues) || [];
      if (enumVals.length > 0) {
        const normalizedIncoming = department.toString().trim().toLowerCase();
        let found = enumVals.find((v) => v.toString().trim().toLowerCase() === normalizedIncoming);
        if (!found) {
          const compactIncoming = normalizedIncoming.replace(/\s+/g, "");
          found = enumVals.find((v) => v.toString().trim().toLowerCase().replace(/\s+/g, "") === compactIncoming);
        }
        if (found) {
          departmentForSave = found;
        } else {
          console.warn(
            `Department "${department}" does not match Task enum values. Allowed: [${enumVals.join(", ")}]. Saving original value.`
          );
        }
      }
    } catch (e) {
      console.warn("Could not read Task enum values to normalize department:", e);
    }

    const completionValue =
      completion !== "" && completion !== undefined ? Number(completion) : 0;
    const taskStatus = status || "Backlog";

    const newTask = new Task({
      assigneeName,
      projectId,
      project,
      department: departmentForSave,
      startDate,
      endDate,
      dueDate,
      completion: completionValue,
      status: taskStatus,
      remarks,
    });

    const savedTask = await newTask.save();
    console.log("✅ Task saved successfully:", savedTask._id ?? savedTask);

    let assigneeLabel = assigneeName;
    try {
      const emp = await Employee.findOne({ name: new RegExp(`^${assigneeName}$`, "i") }, "empId name").lean();
      if (emp) assigneeLabel = `${emp.name}${emp.empId ? ` (${emp.empId})` : ""}`;
    } catch (err) {
      console.warn("Assignee lookup failed:", err);
    }

    const deptKey = normalizeDeptKey(departmentForSave);
    const webhookUrl = DEPT_WEBHOOK_MAP[deptKey] ?? DEPT_WEBHOOK_MAP["tech"];

    if (!webhookUrl) {
      console.warn("⚠️ No Slack webhook configured for department:", departmentForSave);
    } else {
      try {
        const headline = `📌 New Task — ${departmentForSave}`;
        const blocks: any[] = [
          { type: "section", text: { type: "mrkdwn", text: `*${headline}*` } },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Project:* ${project} (${projectId})\n*Assignee:* ${assigneeLabel}\n*Department:* ${departmentForSave}\n*Status:* ${taskStatus}${dueDate ? `\n*Due:* ${dueDate}` : ""}`,
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