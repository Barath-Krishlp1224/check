import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import Expense from "@/models/Expense";

type RawSubtask = {
  id?: unknown;
  title?: unknown;
  done?: unknown;
  amount?: unknown;
  date?: unknown;
};

async function ensureConnected() {
  await connectToDatabase();
  let tries = 0;
  while (Number(mongoose.connection.readyState) !== 1 && tries < 20) {
    await new Promise((r) => setTimeout(r, 100));
    tries++;
  }
  if (Number(mongoose.connection.readyState) !== 1) {
    throw new Error("Failed to connect to MongoDB");
  }
}

function normalizeSubtask(raw: RawSubtask) {
  const id = raw.id !== undefined ? String(raw.id) : Math.random().toString(36).slice(2, 9);
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const done = typeof raw.done === "boolean" ? raw.done : Boolean(raw.done);
  const amount = raw.amount === undefined || raw.amount === null
    ? undefined
    : (typeof raw.amount === "number" ? raw.amount : Number(raw.amount));
  const date = typeof raw.date === "string" ? raw.date : (raw.date ? String(raw.date) : undefined);

  return {
    id,
    title,
    done,
    ...(amount !== undefined && !Number.isNaN(amount) ? { amount } : {}),
    ...(date ? { date } : {}),
  } as Record<string, unknown>;
}

function normalizeSubtasks(arr: unknown): Record<string, unknown>[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((r) => normalizeSubtask(r as RawSubtask))
    .filter(s => typeof s.title === "string" && (s.title as string).length > 0);
}

function computeExpenseTotal(e: any) {
  const expenseAmount = typeof e.amount === 'number' && !Number.isNaN(e.amount) ? e.amount : Number(e.amount) || 0;
  const subtasksTotal = (e.subtasks || []).reduce((ss: number, st: any) => {
    const a = (st as any).amount;
    return ss + (typeof a === 'number' && !Number.isNaN(a) ? a : Number(a) || 0);
  }, 0);
  return expenseAmount + subtasksTotal;
}

export async function GET(request: Request) {
  try {
    await ensureConnected();

    const url = new URL(request.url);
    const weekStart = url.searchParams.get("weekStart");

    if (weekStart) {
      const wkItems = await Expense.find({ weekStart }).sort({ date: -1 }).lean();
      const weekTotal = wkItems.reduce((s: number, e: any) => s + computeExpenseTotal(e), 0);
      return NextResponse.json({ success: true, data: wkItems, weekTotal }, { status: 200 });
    }

    const expenses = await Expense.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: expenses }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const description = typeof body.description === "string" ? body.description.trim() : "";
    const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const date = typeof body.date === "string" ? body.date : "";
    const weekStart = typeof body.weekStart === "string" ? body.weekStart : "";
    const subtasks = normalizeSubtasks(body.subtasks);
    const shop = body.shop === undefined || body.shop === null ? "" : String(body.shop);

    if (!description || !category || !date || !weekStart || !(typeof amount === "number" && !Number.isNaN(amount))) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid fields. Required: description (string), amount (number), category (string), date (string), weekStart (string)" },
        { status: 400 }
      );
    }

    await ensureConnected();

    const created = new Expense({
      description,
      amount,
      category,
      date,
      shop,
      weekStart,
      subtasks,
      paid: false,
    });

    await created.save();

    return NextResponse.json({ success: true, data: created.toObject() }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { weekStart?: string; ids?: string[] };
    const { weekStart, ids } = body;
    if (!weekStart && (!Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json({ success: false, error: "Provide weekStart or ids array" }, { status: 400 });
    }
    await ensureConnected();
    if (weekStart) {
      const res = await Expense.updateMany({ weekStart, paid: false }, { $set: { paid: true } });
      return NextResponse.json({ success: true, modifiedCount: (res as any).modifiedCount ?? 0 }, { status: 200 });
    }
    if (Array.isArray(ids) && ids.length > 0) {
      const res = await Expense.updateMany({ _id: { $in: ids }, paid: false }, { $set: { paid: true } });
      return NextResponse.json({ success: true, modifiedCount: (res as any).modifiedCount ?? 0 }, { status: 200 });
    }
    return NextResponse.json({ success: false, error: "No valid action performed" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { id?: string; updates?: Record<string, unknown> };
    const { id, updates } = body;
    if (!id || !updates || typeof updates !== "object") {
      return NextResponse.json({ success: false, error: "Provide id and updates" }, { status: 400 });
    }
    await ensureConnected();

    const allowed = ["description", "amount", "category", "date", "shop", "paid", "weekStart", "subtasks"];
    const payload: Record<string, unknown> = {};
    for (const key of Object.keys(updates)) {
      if (!allowed.includes(key)) continue;
      if (key === "shop") {
        payload[key] = updates[key] === undefined || updates[key] === null ? "" : String(updates[key]);
      } else if (key === "amount") {
        const am = typeof updates.amount === "number" ? updates.amount : Number(updates.amount);
        if (!Number.isNaN(am)) payload.amount = am;
      } else if (key === "subtasks") {
        payload.subtasks = normalizeSubtasks(updates.subtasks);
      } else if (key === "date" || key === "category" || key === "description" || key === "weekStart") {
        payload[key] = typeof updates[key] === "string" ? (updates[key] as string).trim() : String(updates[key] || "");
      } else if (key === "paid") {
        payload.paid = Boolean(updates.paid);
      } else {
        payload[key] = updates[key];
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 });
    }

    const updated = await Expense.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
    if (!updated) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id query parameter" }, { status: 400 });
    }
    await ensureConnected();
    const deleted = await Expense.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: deleted }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || String(err) }, { status: 500 });
  }
}