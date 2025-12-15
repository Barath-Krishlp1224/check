// app/api/expenses/route.ts
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
// Assuming Expense, IExpense, Role, SubExpense are correctly imported from models/Expense
import Expense, { IExpense, Role, SubExpense } from "@/models/Expense";

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
  let tries = 0;
  while (Number(mongoose.connection.readyState) !== 1 && tries < 20) {
    await new Promise((r) => setTimeout(r, 100));
    tries++;
  }
  if (Number(mongoose.connection.readyState) !== 1) {
    throw new Error("Failed to connect to MongoDB");
  }
}

function normalizeSubExpense(raw: RawSubExpense): SubExpense | null {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null;

  const id =
    typeof raw.id === "string" && raw.id.length > 0
      ? raw.id
      : Math.random().toString(36).slice(2, 9);

  const done = typeof raw.done === "boolean" ? raw.done : Boolean(raw.done);

  const amount =
    raw.amount === undefined || raw.amount === null
      ? undefined
      : typeof raw.amount === "number" && !Number.isNaN(raw.amount)
      ? raw.amount
      : Number(raw.amount);

  const date =
    typeof raw.date === "string"
      ? raw.date
      : raw.date
      ? String(raw.date)
      : undefined;

  const employeeId =
    raw.employeeId === undefined || raw.employeeId === null
      ? undefined
      : String(raw.employeeId);

  const employeeName =
    typeof raw.employeeName === "string"
      ? raw.employeeName.trim()
      : undefined;

  const subExpense: SubExpense = {
    id,
    title,
    done,
  };

  if (amount !== undefined && !Number.isNaN(amount)) subExpense.amount = amount;
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

function computeExpenseTotal(e: IExpense): number {
  const expenseAmount =
    typeof e.amount === "number" && !Number.isNaN(e.amount)
      ? e.amount
      : Number(e.amount) || 0;

  const subtasksTotal = (e.subtasks || []).reduce(
    (ss: number, st: SubExpense) => {
      const a = st.amount;
      return ss + (typeof a === "number" && !Number.isNaN(a) ? a : 0);
    },
    0
  );

  return expenseAmount + subtasksTotal;
}

function dedupeShopsFromExpenses(expenses: IExpense[]): string[] {
  const seen = new Set<string>();
  const shops: string[] = [];
  for (const e of expenses) {
    const s = (e.shop || "").trim();
    if (!s) continue;
    if (!seen.has(s)) {
      seen.add(s);
      shops.push(s);
    }
  }
  return shops;
}

export async function GET(request: Request) {
  try {
    await ensureConnected();

    const url = new URL(request.url);
    const weekStart = url.searchParams.get("weekStart");

    if (weekStart) {
      const wkItems = (await Expense.find({ weekStart })
        .sort({ date: -1 })
        .lean()) as unknown as IExpense[];

      const weekTotal = wkItems.reduce(
        (s: number, e: IExpense) => s + computeExpenseTotal(e),
        0
      );

      const shops = dedupeShopsFromExpenses(wkItems);

      return NextResponse.json(
        { success: true, data: wkItems, weekTotal, shops },
        { status: 200 }
      );
    }

    const expenses = (await Expense.find({})
      .sort({ createdAt: -1 })
      .lean()) as unknown as IExpense[];

    const shops = dedupeShopsFromExpenses(expenses);

    return NextResponse.json(
      { success: true, data: expenses, shops },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("GET Expense Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    const amount =
      typeof body.amount === "number" ? body.amount : Number(body.amount);

    const date = typeof body.date === "string" ? body.date : "";
    const weekStart = typeof body.weekStart === "string" ? body.weekStart : "";

    const shop =
      body.shop === undefined || body.shop === null ? "" : String(body.shop);

    const roleRaw =
      typeof body.role === "string" ? body.role.trim() : "other";
    const role: Role = (["founder", "manager", "other"].includes(roleRaw)
      ? roleRaw
      : "other") as Role;

    const employeeId =
      body.employeeId === undefined || body.employeeId === null
        ? undefined
        : String(body.employeeId);

    const employeeName =
      typeof body.employeeName === "string"
        ? body.employeeName.trim()
        : undefined;

    const subtasks = normalizeSubExpenses(body.subtasks);

    if (
      !description ||
      !date ||
      !weekStart ||
      !(typeof amount === "number" && !Number.isNaN(amount) && amount >= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing or invalid fields. Required: description (string), amount (number >= 0), date (string), weekStart (string)",
        },
        { status: 400 }
      );
    }

    if (role === "manager" && (!employeeId || !employeeName)) {
      return NextResponse.json(
        {
          success: false,
          error: "Employee ID and Name are required for Manager role.",
        },
        { status: 400 }
      );
    }

    await ensureConnected();

    const created = new Expense({
      description,
      amount,
      date,
      shop,
      weekStart,
      paid: false,
      role,
      employeeId,
      employeeName,
      subtasks,
    });

    await created.save();

    return NextResponse.json(
      { success: true, data: created.toObject() },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST Expense Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      weekStart?: string;
      ids?: string[];
    };
    const { weekStart, ids } = body;

    if (!weekStart && (!Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Provide weekStart or ids array" },
        { status: 400 }
      );
    }

    await ensureConnected();
    let res: mongoose.UpdateWriteOpResult | undefined;

    if (weekStart) {
      res = await Expense.updateMany(
        { weekStart, paid: false },
        { $set: { paid: true } }
      );
    } else if (Array.isArray(ids) && ids.length > 0) {
      res = await Expense.updateMany(
        { _id: { $in: ids }, paid: false },
        { $set: { paid: true } }
      );
    }

    if (res) {
      return NextResponse.json(
        { success: true, modifiedCount: (res as any).modifiedCount ?? 0 },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, error: "No valid update criteria provided" },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("PUT Expense Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      updates?: Record<string, any>;
    };
    const { id, updates } = body;

    if (!id || !updates || typeof updates !== "object") {
      return NextResponse.json(
        { success: false, error: "Provide id and updates object" },
        { status: 400 }
      );
    }

    // 🔴 IMPORTANT CHECK FOR VERCEL ISSUE
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error(`PATCH Invalid ID format: ${id}`);
        return NextResponse.json(
            { success: false, error: "Invalid Expense ID format" },
            { status: 400 }
        );
    }

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
        case "shop":
          payload[key] = String(updates[key] || "").trim();
          break;
        case "amount":
          const am = Number(updates.amount);
          if (!Number.isNaN(am) && am >= 0) payload.amount = am;
          break;
        case "subtasks":
          payload.subtasks = normalizeSubExpenses(updates.subtasks);
          break;
        case "date":
        case "description":
        case "weekStart":
          payload[key] = String(updates[key] || "").trim();
          break;
        case "employeeName":
          payload.employeeName = String(updates[key] || "").trim();
          break;
        case "paid":
          payload.paid = Boolean(updates.paid);
          break;
        case "role":
          const roleRaw = String(updates.role || "other").trim();
          payload.role = ["founder", "manager", "other"].includes(roleRaw)
            ? roleRaw
            : "other";
          break;
        case "employeeId":
          // Ensure that employeeId is set to null if intended to be cleared, 
          // as Mongoose will automatically remove it if set to undefined, but 
          // explicitly setting null is safer for clearing fields.
          payload.employeeId =
            updates.employeeId === "" || updates.employeeId === null
              ? null // Explicitly set null to clear employeeId field in MongoDB
              : String(updates.employeeId);
          break;
        default:
          payload[key] = updates[key];
          break;
      }
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Role validation check (needs existing data for comparison)
    if (payload.role === "manager" && !payload.employeeId) {
      const existing = (await Expense.findById(id).lean()) as
        | IExpense
        | null;
      
      // If the update payload sets role to manager but employeeId is null/missing
      // check if the existing document also lacks employeeId (or if we are updating from a non-manager role).
      // Note: This logic assumes you must provide employee details when changing to manager.
      const isUpdatingToManagerWithoutEmployee = 
        updates.role === "manager" && 
        (updates.employeeId === null || updates.employeeId === undefined);
      
      if (isUpdatingToManagerWithoutEmployee && (!existing || !existing.employeeId)) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Employee ID is required for Manager role update if not previously set.",
          },
          { status: 400 }
        );
      }
    }


    const updated = (await Expense.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true }
    ).lean()) as unknown as IExpense | null;

    if (!updated) {
      // 🔴 THIS IS THE LINE THAT IS RETURNING "Expense not found"
      // If this fires on Vercel but not locally, the ID (id) is the problem.
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated }, { status: 200 });
  } catch (err: any) {
    console.error("PATCH Expense Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    let id: string | null = null;

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = (await request.json().catch(() => null)) as
        | { id?: unknown }
        | null;
      if (body && typeof body.id === "string" && body.id.trim().length > 0) {
        id = body.id.trim();
      }
    }

    if (!id) {
      const url = new URL(request.url);
      const qpId = url.searchParams.get("id");
      if (qpId && qpId.trim().length > 0) {
        id = qpId.trim();
      }
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id (in body or query param)" },
        { status: 400 }
      );
    }

    await ensureConnected();
    const deleted = await Expense.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: deleted }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE Expense Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}