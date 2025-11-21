// app/api/holidays/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "../../../lib/mongoose";
import Holiday from "../../../models/Holiday";

/**
 * GET /api/holidays
 * Optional query: ?channel=SLACK_WEBHOOK_URL_HR
 */
export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const channelFilter = url.searchParams.get("channel") || undefined;

    const query: any = {};
    if (channelFilter) query.slackChannelKey = channelFilter;

    const holidays = await Holiday.find(query).sort({ month: 1, day: 1, dateISO: 1 }).lean();
    return NextResponse.json({ ok: true, holidays }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/holidays error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/holidays
 * body: { name, description, isRecurring, month, day, dateISO, slackChannelKey }
 */
export async function POST(req: Request) {
  try {
    await connectToDatabase();

    const body = await req.json();

    const name = (body.name || "").toString().trim();
    const description = body.description ? String(body.description) : "";
    const isRecurring = typeof body.isRecurring === "boolean" ? body.isRecurring : !!(body.month && body.day);
    const slackChannelKey = body.slackChannelKey ? String(body.slackChannelKey).trim() : "SLACK_WEBHOOK_URL_ACC";

    if (!name) {
      return NextResponse.json({ ok: false, error: "Name is required" }, { status: 400 });
    }

    // Validate recurring vs one-off
    if (isRecurring) {
      const month = Number(body.month);
      const day = Number(body.day);
      if (!month || month < 1 || month > 12) {
        return NextResponse.json({ ok: false, error: "Valid month (1-12) required for recurring holiday" }, { status: 400 });
      }
      if (!day || day < 1 || day > 31) {
        return NextResponse.json({ ok: false, error: "Valid day (1-31) required for recurring holiday" }, { status: 400 });
      }

      // Prevent duplicate recurring holiday with same name + month + day
      const exists = await Holiday.findOne({ name: name, isRecurring: true, month, day });
      if (exists) {
        return NextResponse.json({ ok: false, error: "Recurring holiday with same name and date already exists" }, { status: 409 });
      }

      const doc = await Holiday.create({
        name,
        description,
        isRecurring: true,
        month,
        day,
        slackChannelKey
      });

      return NextResponse.json({ ok: true, holiday: doc }, { status: 201 });
    } else {
      // one-off dateISO required
      if (!body.dateISO) {
        return NextResponse.json({ ok: false, error: "dateISO is required for non-recurring holiday" }, { status: 400 });
      }
      const dateObj = new Date(body.dateISO);
      if (Number.isNaN(dateObj.getTime())) {
        return NextResponse.json({ ok: false, error: "Invalid dateISO format" }, { status: 400 });
      }

      // Prevent duplicate one-off holiday with same name + dateISO
      const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      const exists = await Holiday.findOne({
        name: name,
        isRecurring: false,
        dateISO: {
          $gte: startOfDay,
          $lt: new Date(startOfDay.getFullYear(), startOfDay.getMonth(), startOfDay.getDate() + 1)
        }
      });

      if (exists) {
        return NextResponse.json({ ok: false, error: "One-off holiday with same name and date already exists" }, { status: 409 });
      }

      const doc = await Holiday.create({
        name,
        description,
        isRecurring: false,
        dateISO: dateObj,
        slackChannelKey
      });

      return NextResponse.json({ ok: true, holiday: doc }, { status: 201 });
    }
  } catch (err: any) {
    console.error("POST /api/holidays error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Server error" }, { status: 500 });
  }
}
