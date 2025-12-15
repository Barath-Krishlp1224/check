import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import Expense, { IExpense, Role, SubExpense } from "@/models/Expense";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RawSubExpense = {
  id?: unknown;
  title?: unknown;
  done?: unknown;
  amount?: unknown;
  date?: unknown;
  employeeId?: unknown;
  employeeName?: unknown;
};

async function ensureConnected() {
  await connectToDatabase();
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB not connected");
  }
}

function normalizeSubExpense(raw: RawSubExpense): SubExpense | null {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null;

  const id =
    typeof raw.id === "string" && raw.id.length > 0
      ? raw.id
      : new mongoose.Types.ObjectId().toString();

  const done = Boolean(raw.done);

  const amount =
    raw.amount === undefined || raw.amount === null
      ? undefined
      : Number(raw.amount);

  const date = raw.date ? String(raw.date) : undefined;
  const employeeId = raw.employeeId ? String(raw.employeeId) : undefined;
  const employeeName =
    typeof raw.employeeName === "string"
      ? raw.employeeName.trim()
      : undefined;

  const subExpense: SubExpense = { id, title, done };

  if (!Number.isNaN(amount)) subExpense.amount = amount;
  if (date) subExpense.date = date;
  if (employeeId) subExpense.employeeId = employeeId;
  if (employeeName) subExpense.employeeName = employeeName;

  return subExpense;
}

function normalizeSubExpenses(arr: unknown): SubExpense[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((r) => normalizeSubExpense(r as RawSubExpense))
    .filter((s): s is SubExpense => s !== null);
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      updates?: Record<string, any>;
    };

    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json(
        { success: false, error: "Missing id or updates" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid Expense ID format" },
        { status: 400 }
      );
    }

    const expenseId = new mongoose.Types.ObjectId(id);

    await ensureConnected();

    const allowed = [
      "description",
      "amount",
      "date",
      "shop",
      "paid",
      "weekStart",
      "subtasks",
      "role",
      "employeeId",
      "employeeName",
    ];

    const payload: Record<string, unknown> = {};

    for (const key of Object.keys(updates)) {
      if (!allowed.includes(key)) continue;

      switch (key) {
        case "amount":
          const amt = Number(updates.amount);
          if (!Number.isNaN(amt) && amt >= 0) payload.amount = amt;
          break;
        case "subtasks":
          payload.subtasks = normalizeSubExpenses(updates.subtasks);
          break;
        case "employeeId":
          payload.employeeId =
            updates.employeeId === "" || updates.employeeId === null
              ? null
              : String(updates.employeeId);
          break;
        case "role":
          const roleRaw = String(updates.role || "other");
          payload.role = ["founder", "manager", "other"].includes(roleRaw)
            ? roleRaw
            : "other";
          break;
        default:
          payload[key] = String(updates[key] || "").trim();
          break;
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await Expense.findOneAndUpdate(
      { _id: expenseId },
      { $set: payload },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PATCH Expense Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
