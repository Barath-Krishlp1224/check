import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import Employee from "@/models/Employee";

// --- Slack Webhook Mapping ---
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

    // --- 🛠️ AUTO-FIX: DROP THE UNIQUE INDEX ---
    // This part fixes the E11000 error by removing the "One Task Per Project" rule
    try {
      const collection = Task.collection;
      await collection.dropIndex("projectId_1");
      console.log("Successfully removed the unique constraint on projectId.");
    } catch (e) {
      // Index already dropped or doesn't exist, which is fine.
    }

    // 1. Validation: Ensure frontend is sending correct keys
    // Frontend taskFormData uses: taskId, projectName, assigneeNames, department, etc.
    if (!body.projectId || !body.taskId || !body.projectName) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (projectId, taskId, or projectName)." },
        { status: 400 }
      );
    }

    // 2. Prepare the Task Data
    const completionValue = body.completion !== "" && body.completion !== undefined ? Number(body.completion) : 0;

    const newTask = new Task({
      projectId: body.projectId,     // The Database Object ID
      taskId: body.taskId,           // The Human Readable ID (e.g. WEB-01)
      project: body.projectName,     // Maps projectName from frontend to project in DB
      assigneeNames: body.assigneeNames,
      department: body.department,
      startDate: body.startDate,
      endDate: body.endDate,
      dueDate: body.dueDate,
      completion: completionValue,
      status: body.status || "Backlog",
      remarks: body.remarks,
      subtasks: body.subtasks || [],
      taskStoryPoints: Number(body.taskStoryPoints) || 0,
      taskTimeSpent: body.taskTimeSpent || "",
    });

    // 3. Save to MongoDB
    const savedTask = await newTask.save();

    // 4. Slack Notification Logic
    const primaryAssignee = body.assigneeNames[0];
    let assigneeLabel = primaryAssignee;
    
    try {
      const emp = await Employee.findOne({ name: new RegExp(`^${primaryAssignee}$`, "i") }).lean();
      if (emp) assigneeLabel = `${emp.name}${emp.empId ? ` (${emp.empId})` : ""}`;
    } catch (e) {
      console.warn("Could not find employee for Slack label");
    }

    const deptKey = normalizeDeptKey(body.department);
    const webhookUrl = DEPT_WEBHOOK_MAP[deptKey] ?? DEPT_WEBHOOK_MAP["tech"];

    if (webhookUrl) {
      const blocks = [
        { 
          type: "section", 
          text: { 
            type: "mrkdwn", 
            text: `🚀 *New Task Created*\n*Project:* ${body.projectName} (${body.taskId})` 
          } 
        },
        { 
          type: "section", 
          text: { 
            type: "mrkdwn", 
            text: `👤 *Assignee:* ${assigneeLabel}\n📅 *Deadline:* ${body.dueDate || 'No Date'}` 
          } 
        }
      ];
      await postToSlack(webhookUrl, { blocks });
    }

    return NextResponse.json(
      { success: true, message: "Task created successfully", task: savedTask },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("🔥 POST /api/tasks/add Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to add task" },
      { status: 500 }
    );
  }
}