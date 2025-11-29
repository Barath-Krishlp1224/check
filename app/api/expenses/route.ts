// app/api/expenses/route.ts

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import Expense, { IExpense, Role, SubExpense } from "@/models/Expense"; // Import IExpense and SubExpense

// Updated type for normalization functions
type RawSubExpense = {
  id?: unknown;
  title?: unknown;
  done?: unknown;
  amount?: unknown;
  date?: unknown;
  role?: unknown;
  employeeId?: unknown;
  employeeName?: unknown;
};

// Utility to ensure connection is established
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

// Normalized one sub-expense item
function normalizeSubExpense(raw: RawSubExpense): SubExpense | null {
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!title) return null; // Require a title

  // Generate ID if missing
  const id =
    typeof raw.id === "string" && raw.id.length > 0
      ? raw.id
      : Math.random().toString(36).slice(2, 9);
      
  const done = typeof raw.done === "boolean" ? raw.done : Boolean(raw.done);

  // Parse amount safely
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

  const role =
    typeof raw.role === "string" &&
    ["founder", "manager", "other"].includes(raw.role)
      ? (raw.role as Role)
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
  if (role) subExpense.role = role;
  if (employeeId) subExpense.employeeId = employeeId;
  if (employeeName) subExpense.employeeName = employeeName;

  return subExpense;
}

// Normalizes an array of raw sub-expenses
function normalizeSubExpenses(arr: unknown): SubExpense[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((r) => normalizeSubExpense(r as RawSubExpense))
    .filter((s): s is SubExpense => s !== null);
}

// Computes the total amount including subtasks - Type fix applied here
function computeExpenseTotal(e: IExpense): number {
  const expenseAmount =
    typeof e.amount === "number" && !Number.isNaN(e.amount)
      ? e.amount
      : Number(e.amount) || 0;

  const subtasksTotal = (e.subtasks || []).reduce((ss: number, st: SubExpense) => {
    const a = st.amount;
    return ss + (typeof a === "number" && !Number.isNaN(a) ? a : 0);
  }, 0);

  return expenseAmount + subtasksTotal;
}

/**
 * GET handler: Fetches expenses. Supports filtering by weekStart.
 */
export async function GET(request: Request) {
  try {
    await ensureConnected();

    const url = new URL(request.url);
    const weekStart = url.searchParams.get("weekStart");

    if (weekStart) {
      // FIX: Double cast applied
      const wkItems = (await Expense.find({ weekStart })
        .sort({ date: -1 })
        .lean() as unknown) as IExpense[];
        
      const weekTotal = wkItems.reduce(
        (s: number, e: IExpense) => s + computeExpenseTotal(e),
        0
      );
      return NextResponse.json(
        { success: true, data: wkItems, weekTotal },
        { status: 200 }
      );
    }

    // FIX: Double cast applied
    const expenses = (await Expense.find({}).sort({ createdAt: -1 }).lean() as unknown) as IExpense[];
    return NextResponse.json(
      { success: true, data: expenses },
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

/**
 * POST handler: Creates a new expense.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    const description =
      typeof body.description === "string" ? body.description.trim() : "";
      
    const amount =
      typeof body.amount === "number" ? body.amount : Number(body.amount);
      
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
      
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
      !category ||
      !date ||
      !weekStart ||
      !(typeof amount === "number" && !Number.isNaN(amount) && amount >= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing or invalid fields. Required: description (string), amount (number >= 0), category (string), date (string), weekStart (string)",
        },
        { status: 400 }
      );
    }
    
    // Validation for Manager role
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
      category,
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

/**
 * PUT handler: Marks expenses as paid based on weekStart or a list of IDs.
 */
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
          { success: true, modifiedCount: res.modifiedCount ?? 0 },
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

/**
 * PATCH handler: Updates a single expense by ID.
 */
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      updates?: Record<string, unknown>; // Use Record<string, unknown>
    };
    const { id, updates } = body;

    if (!id || !updates || typeof updates !== "object") {
      return NextResponse.json(
        { success: false, error: "Provide id and updates object" },
        { status: 400 }
      );
    }

    await ensureConnected();

    const allowed = [
      "description",
      "amount",
      "category",
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
        case "category":
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
          payload.employeeId =
            updates.employeeId === undefined || updates.employeeId === null
              ? undefined
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
    
    // Conditional validation (check if role is being set to manager without employee details)
    if (payload.role === "manager" && !payload.employeeId && !payload.employeeName) {
        // We need to fetch the existing expense to check if employee details exist
        // FIX: Double cast applied
        const existing = (await Expense.findById(id).lean() as unknown) as IExpense | null;
        if (existing && existing.role !== "manager" && (!existing.employeeId || !existing.employeeName)) {
            return NextResponse.json(
              { success: false, error: "Employee details are required when setting role to manager." },
              { status: 400 }
            );
        }
    }

    // FIX: Double cast applied
    const updated = (await Expense.findByIdAndUpdate(
      id,
      { $set: payload },
      { new: true }
    ).lean() as unknown) as IExpense | null;

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
      { success: false, error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler: Deletes a single expense by ID from query params.
 */
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id query parameter" },
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
    return NextResponse.json(
      { success: true, data: deleted },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("DELETE Expense Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}