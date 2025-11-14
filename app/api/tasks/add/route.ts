import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

const webhookUrl = process.env.SLACK_WEBHOOK_URL!; 

export async function POST(req: Request) {
  await connectDB();

  try {
    const body = await req.json();
    console.log("🟡 Incoming Task Data:", body);

    const {
      projectId,
      assigneeName,
      project,
      startDate,
      endDate,
      dueDate,
      completion,
      status, 
      remarks,
    } = body;

    // ✅ Validation
    if (!assigneeName || !projectId || !project) {
      return NextResponse.json(
        { error: "Missing required fields: assigneeName, projectId, project" },
        { status: 400 }
      );
    }

    const completionValue =
      completion !== "" && completion !== undefined ? Number(completion) : 0;
      
    // Use the status provided by the frontend, defaulting to "Backlog"
    const taskStatus = status || "Backlog";

    // ✅ Create new Task
    const newTask = new Task({
      assigneeName,
      projectId,
      project,
      startDate,
      endDate,
      dueDate,
      completion: completionValue,
      status: taskStatus, // Use the determined status
      remarks,
    });

    const savedTask = await newTask.save();
    console.log("✅ Task saved successfully:", savedTask);

    // --- Slack notification setup ---
    try {
      let notificationText = `📢 *Hey ${assigneeName}, a new task has been added to the Backlog!*`;
      if (taskStatus !== "Backlog") {
          notificationText = `📢 *Hey ${assigneeName}, a new task has been created!*`;
      }
      
      const slackMessage = {
        text: `${notificationText}\n• *ID:* ${projectId}\n• *Project:* ${project}\n• *Assignee:* ${assigneeName}\n• *Status:* ${taskStatus}\n• *Completion:* ${completionValue}%\n• *Due Date:* ${dueDate || "N/A"}\n• *Remarks:* ${remarks || "None"}`,
      };

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackMessage),
      });

      console.log("✅ Slack notification sent!");
    } catch (slackErr) {
      console.error("⚠️ Slack notification failed:", slackErr);
    }
    // -----------------------------------

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