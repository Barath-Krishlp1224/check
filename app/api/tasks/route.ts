import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import Employee from "@/models/Employee";

// --- Types ---
interface Subtask {
  id?: string | null;
  title: string;
  status: string;
  completion: number;
  remarks?: string;
  assigneeName?: string;
  subtasks?: Subtask[];
}

type ReqBody = {
  projectId: string;    // The Database _id of the project
  taskId: string;       // The Display ID (e.g., PROJ-101)
  assigneeNames: string[];
  projectName: string;
  department: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  completion?: string | number;
  status?: string;
  remarks?: string;
  subtasks?: Subtask[];
};

// --- Slack Configuration ---
const DEPT_WEBHOOK_MAP: Record<string, string | undefined> = {
  tech: process.env.SLACK_WEBHOOK_URL,
  accounts: process.env.SLACK_WEBHOOK_URL_ACC,
  "it admin": process.env.SLACK_WEBHOOK_URL_ITADMIN ?? process.env.SLACK_WEBHOOK_URL,
  manager: process.env.SLACK_WEBHOOK_URL_MANAGER ?? process.env.SLACK_WEBHOOK_URL,
  "admin & operations": process.env.SLACK_WEBHOOK_URL_ADMINOPS ?? process.env.SLACK_WEBHOOK_URL,
  hr: process.env.SLACK_WEBHOOK_URL_HR ?? process.env.SLACK_WEBHOOK_URL,
  founders: process.env.SLACK_WEBHOOK_URL_FOUNDERS ?? process.env.SLACK_WEBHOOK_URL,
  "tl-reporting manager": process.env.SLACK_WEBHOOK_URL_TL ?? process.env.SLACK_WEBHOOK_URL,
  "tl accountant": process.env.SLFLACK_WEBHOOK_URL_TLACC ?? process.env.SLACK_WEBHOOK_URL_ACC,
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
    console.error("Slack failed:", err);
  }
}

// --- GET: Fetch tasks for a specific project ---
export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const assigneeName = searchParams.get("assigneeName");

    let query: any = {};

    // 1. MANDATORY FILTER: Only get tasks for the selected project
    if (projectId) {
      query.projectId = projectId; 
    }

    // 2. OPTIONAL FILTER: Filter by assignee
    if (assigneeName) {
      query.assigneeNames = { $regex: new RegExp(assigneeName, 'i') };
    }

    const tasks = await Task.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// --- POST: Create a new task ---
export async function POST(req: Request) {
  await connectDB();
  try {
    const body = (await req.json()) as ReqBody;

    // Check against the fields you are actually sending from the frontend
    if (!body.projectId || !body.taskId || !body.assigneeNames || body.assigneeNames.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: projectId, taskId, or assignees." },
        { status: 400 }
      );
    }

    const completionValue = body.completion !== "" && body.completion !== undefined ? Number(body.completion) : 0;

    const newTask = new Task({
      projectId: body.projectId, // The DB ID of the project
      taskId: body.taskId,       // The human-readable ID (e.g., "WEB-1234")
      project: body.projectName,
      assigneeNames: body.assigneeNames,
      department: body.department,
      startDate: body.startDate,
      endDate: body.endDate,
      dueDate: body.dueDate,
      completion: completionValue,
      status: body.status || "Backlog",
      remarks: body.remarks,
      subtasks: body.subtasks || [],
    });

    const savedTask = await newTask.save();

    // --- Slack Notification Logic ---
    const primaryAssignee = body.assigneeNames[0];
    let assigneeLabel = primaryAssignee;
    
    const emp = await Employee.findOne({ name: new RegExp(`^${primaryAssignee}$`, "i") }).lean();
    if (emp) assigneeLabel = `${emp.name}${emp.empId ? ` (${emp.empId})` : ""}`;

    const assigneeDisplay = body.assigneeNames.length > 1 
      ? `${assigneeLabel} (+${body.assigneeNames.length - 1} others)`
      : assigneeLabel;
    
    const deptKey = normalizeDeptKey(body.department);
    const webhookUrl = DEPT_WEBHOOK_MAP[deptKey] ?? DEPT_WEBHOOK_MAP["tech"];

    if (webhookUrl) {
      const blocks = [
        { 
          type: "section", 
          text: { type: "mrkdwn", text: `👤 *Assignee:* ${assigneeDisplay}\n📌 *New Task Created*` } 
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Project:* ${body.projectName}\n*Task ID:* ${body.taskId}\n*Status:* ${body.status || "Backlog"}`, 
          },
        }
      ];
      await postToSlack(webhookUrl, { blocks });
    }

    return NextResponse.json({ success: true, task: savedTask }, { status: 201 });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}