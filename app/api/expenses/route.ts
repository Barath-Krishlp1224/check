import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongoose";
import Expense from "@/models/Expense";

async function ensureConnected() {
  await connectToDatabase();

  if (Number(mongoose.connection.readyState) !== 1) {
    let tries = 0;
    while (Number(mongoose.connection.readyState) !== 1 && tries < 10) {
      await new Promise((r) => setTimeout(r, 100));
      tries++;
    }
  }
}

export async function GET(request: Request) {
  try {
    await ensureConnected();
    const expenses = await Expense.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: expenses });
  } catch (err: any) {
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

    await ensureConnected();
    const created = await Expense.create({ description, amount, category, date });
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    await ensureConnected();
    await Expense.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
