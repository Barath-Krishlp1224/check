// scripts/scheduler.ts
import dotenv from "dotenv";
dotenv.config();

import cron from "node-cron";
import { connectToDatabase } from "../lib/mongoose";
import Holiday from "../models/Holiday";
import SentNotification from "../models/SentNotification";
import { differenceInCalendarDays, startOfDay } from "date-fns";
import { sendSlackMessage } from "../utils/slack";

// Run every day at 12:00 AM and 09:00 AM (midnight and 9 AM)
const CRON_EXPR = process.env.SCHEDULER_CRON || "0 0,9 * * *";

// Use India timezone
const TIMEZONE = process.env.SCHEDULER_TIMEZONE || "Asia/Kolkata";

const WEBHOOK_ENV_KEY = "SLACK_WEBHOOK_URL_ACC"; // default webhook env key (you can change per-holiday if your Holiday model uses slackChannelKey)

// Compute next occurrence of holiday
async function computeNextOccurrence(holiday: any, now: Date) {
  const todayYear = now.getFullYear();

  if (!holiday.isRecurring && holiday.dateISO) {
    const occ = startOfDay(new Date(holiday.dateISO));
    return { date: occ, year: occ.getFullYear() };
  }

  const month = holiday.month;
  const day = holiday.day;

  if (!month || !day) {
    throw new Error(`Holiday ${holiday.name} missing month/day for recurring calculation`);
  }

  let candidate = startOfDay(new Date(todayYear, month - 1, day));
  if (candidate < startOfDay(now)) {
    candidate = startOfDay(new Date(todayYear + 1, month - 1, day));
  }

  return { date: candidate, year: candidate.getFullYear() };
}

// Process notifications and send Slack messages
async function processNotifications() {
  console.log(new Date().toISOString(), "Holiday scheduler running...");

  await connectToDatabase();

  const now = new Date();
  const holidays = await Holiday.find({}).lean();

  for (const h of holidays) {
    try {
      const { date: occDate, year } = await computeNextOccurrence(h, now);
      const daysDiff = differenceInCalendarDays(startOfDay(occDate), startOfDay(now));

      const mapping: Record<number, "7_days" | "2_days" | "on_day"> = {
        7: "7_days",
        2: "2_days",
        0: "on_day",
      };

      const notifType = mapping[daysDiff];
      if (!notifType) continue;

      // avoid duplicate sends for same holiday/type/year
      const already = await SentNotification.findOne({
        holidayId: h._id,
        type: notifType,
        year,
      });

      if (already) {
        // already sent earlier (maybe at midnight), so skip
        continue;
      }

      const dateStr = occDate.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      let text = "";
      if (notifType === "7_days") {
        text = `Reminder: *${h.name}* is coming on *${dateStr}* — 7 days left.`;
      } else if (notifType === "2_days") {
        text = `Reminder: *${h.name}* is in 2 days — *${dateStr}*.`;
      } else {
        text = `🎉 *Happy ${h.name}!* (${dateStr})`;
      }

      const blocks = [
        { type: "section", text: { type: "mrkdwn", text } },
        {
          type: "context",
          elements: [{ type: "mrkdwn", text: h.description || "" }],
        },
      ];

      // If you store a per-holiday slackChannelKey, prefer it; otherwise use default env key
      const webhookEnvKey = h.slackChannelKey || WEBHOOK_ENV_KEY;
      const sent = await sendSlackMessage(text, blocks, webhookEnvKey);

      if (sent) {
        await SentNotification.create({ holidayId: h._id, type: notifType, year });
        console.log(`Sent ${notifType} for ${h.name} (${dateStr}) via ${webhookEnvKey}`);
      } else {
        console.log(`Failed to send ${notifType} for ${h.name}`);
      }
    } catch (err: any) {
      console.error(`Error processing ${h?.name}:`, err?.message ?? err);
    }
  }
}

// Start the scheduler
async function start() {
  await processNotifications(); // Run immediately once (on startup)

  cron.schedule(
    CRON_EXPR,
    async () => {
      try {
        await processNotifications();
      } catch (err) {
        console.error("Scheduler cycle error:", err);
      }
    },
    { timezone: TIMEZONE }
  );

  console.log(`Scheduler running daily at 12:00 AM and 09:00 AM IST — Cron: "${CRON_EXPR}", Timezone: "${TIMEZONE}"`);
}

start().catch((err) => {
  console.error("Scheduler failed to start:", err);
  process.exit(1);
});
