// app/api/tasks/reminders/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

const techWebhookUrl = process.env.SLACK_WEBHOOK_URL;
const accountsWebhookUrl = process.env.SLACK_WEBHOOK_URL_ACC;

function getDateOnly(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export async function POST() {
  await connectDB();

  try {
    const today = getDateOnly(new Date());

    // ✅ Find tasks that have a due date and are not completed
    const tasks = await Task.find({
      dueDate: { $exists: true, $nin: [null, ""] }, // ✅ no duplicate keys
      status: { $ne: "Completed" },
    });

    let reminderCount = 0;
    let overdueCount = 0;

    for (const task of tasks) {
      const { projectId, project, assigneeName, dueDate, department } = task;

      if (!dueDate) continue; // safety

      // dueDate stored as "YYYY-MM-DD"
      const due = getDateOnly(new Date(`${dueDate}T00:00:00`));
      const diffDays = Math.round(
        (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Decide Slack webhook based on department (fallback to tech)
      let webhookUrl: string | undefined = techWebhookUrl || undefined;
      if (department === "Accounts") {
        webhookUrl = accountsWebhookUrl || webhookUrl;
      }

      // 1️⃣ Reminder: 2 days before due date
      if (diffDays === 2 && !task.dueReminderSent && webhookUrl) {
        const text =
          `⏰ *Reminder: Task due in 2 days*\n` +
          `• *ID:* ${projectId}\n` +
          `• *Project:* ${project}\n` +
          `• *Assignee:* ${assigneeName}\n` +
          `• *Due Date:* ${dueDate}`;

        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          task.dueReminderSent = true;
          await task.save();
          reminderCount++;
        } catch (err) {
          console.error(
            `Failed to send reminder Slack for task ${projectId}`,
            err
          );
        }
      }

      // 2️⃣ Overdue alert: due date is in the past
      if (diffDays < 0 && !task.overdueNotified && webhookUrl) {
        const text =
          `⚠️ *Overdue Task Alert*\n` +
          `• *ID:* ${projectId}\n` +
          `• *Project:* ${project}\n` +
          `• *Assignee:* ${assigneeName}\n` +
          `• *Due Date:* ${dueDate}\n` +
          `• Status: ${task.status}`;

        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          task.overdueNotified = true;
          await task.save();
          overdueCount++;
        } catch (err) {
          console.error(
            `Failed to send overdue Slack for task ${projectId}`,
            err
          );
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Reminder job completed",
        remindersSent: reminderCount,
        overdueAlertsSent: overdueCount,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("🔥 Error running reminders:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to run reminders." },
      { status: 500 }
    );
  }
}
