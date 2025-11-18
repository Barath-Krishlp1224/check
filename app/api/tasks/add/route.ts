// app/api/tasks/add/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

const techWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const accountsWebhookUrl = process.env.SLACK_WEBHOOK_URL_ACC;

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();
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
    } = body;

    // ✅ Basic validation
    if (!assigneeName || !projectId || !project) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: assigneeName, projectId, project",
        },
        { status: 400 }
      );
    }

    if (!department) {
      return NextResponse.json(
        { error: "Department is required (Tech or Accounts)." },
        { status: 400 }
      );
    }

    const completionValue =
      completion !== "" && completion !== undefined
        ? Number(completion)
        : 0;

    const taskStatus = status || "Backlog";

    // ✅ Create new Task in DB
    const newTask = new Task({
      assigneeName,
      projectId,
      project,
      department,
      startDate,
      endDate,
      dueDate,
      completion: completionValue,
      status: taskStatus,
      remarks,
    });

    const savedTask = await newTask.save();
    console.log("✅ Task saved successfully:", savedTask);

    // --- Slack notification ---
    try {
      let webhookUrl: string | undefined;

      if (department === "Accounts") {
        webhookUrl = accountsWebhookUrl || undefined;
      } else if (department === "Tech") {
        webhookUrl = techWebhookUrl || undefined;
      }

      if (!webhookUrl) {
        console.error(
          "⚠️ No Slack webhook URL configured for department:",
          department
        );
      } else {
        let notificationText = `📢 *Hey ${assigneeName}, a new ${department} task has been added to the Backlog!*`;

        if (taskStatus !== "Backlog") {
          notificationText = `📢 *Hey ${assigneeName}, a new ${department} task has been created!*`;
        }

        const slackMessage = {
          text: `${notificationText}
• *ID:* ${projectId}
• *Project:* ${project}
• *Department:* ${department}
• *Assignee:* ${assigneeName}
• *Status:* ${taskStatus}
• *Completion:* ${completionValue}%
• *Due Date:* ${dueDate || "N/A"}
• *Remarks:* ${remarks || "None"}`,
        };

        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackMessage),
        });

        console.log("✅ Slack notification sent!");
      }
    } catch (slackErr) {
      console.error("⚠️ Slack notification failed:", slackErr);
    }

    return NextResponse.json(
      { success: true, message: "Task added successfully", task: savedTask },
      { status: 201 }
    );
  } catch (error: any) {
    let errorMessage = error.message || "Failed to add task";
    if (error.code === 11000) {
      errorMessage =
        "Project ID must be unique. A task with this ID already exists.";
    }

    console.error("🔥 Error adding task:", errorMessage);
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
