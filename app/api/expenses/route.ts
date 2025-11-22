// app/api/expenses/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Expense from "@/models/Expense";

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    // return all expenses sorted by createdAt desc
    const expenses = await Expense.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: expenses });
  } catch (err: any) {
    console.error("GET /api/expenses error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { description, amount, category, date } = body;

    if (!description || typeof amount !== "number" || !category || !date) {
      return NextResponse.json({ success: false, error: "Missing or invalid fields" }, { status: 400 });
    }

    await connectToDatabase();
    const created = await Expense.create({ description, amount, category, date });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/expenses error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    // expects /api/expenses?id=...
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    await connectToDatabase();
    await Expense.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/expenses error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
