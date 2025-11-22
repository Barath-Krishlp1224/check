import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Bill from "@/models/Bill";

// Assumes connectToDatabase is set up correctly in your project
// await connectToDatabase(); 

export async function GET(req: NextRequest) {
  try {
    // Ensure connection here if not using top-level await in your setup
    // await connectToDatabase();
    const bills = await Bill.find({}).sort({ dueDate: 1, createdAt: -1 }).lean();
    return NextResponse.json({ ok: true, data: bills });
  } catch (err) {
    console.error("GET /api/bills error", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch bills" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Ensure connection here if not using top-level await in your setup
    // await connectToDatabase();
    const body = await req.json();
    const { name, amount, dueDate, paid = false, dateAdded, paidDate = null } = body;

    if (!name || typeof amount !== "number" || !dueDate) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const bill = await Bill.create({ 
      name, 
      amount, 
      dueDate, 
      paid, 
      dateAdded: dateAdded ?? new Date().toLocaleDateString(), 
      paidDate 
    });
    return NextResponse.json({ ok: true, data: bill }, { status: 201 });
  } catch (err) {
    console.error("POST /api/bills error", err);
    return NextResponse.json({ ok: false, error: "Failed to create bill" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Ensure connection here if not using top-level await in your setup
    // await connectToDatabase();
    const body = await req.json();
    const { id, ...patch } = body;
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const updated = await Bill.findByIdAndUpdate(id, patch, { new: true });
    if (!updated) return NextResponse.json({ ok: false, error: "Bill not found" }, { status: 404 });

    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    console.error("PUT /api/bills error", err);
    return NextResponse.json({ ok: false, error: "Failed to update bill" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Ensure connection here if not using top-level await in your setup
    // await connectToDatabase();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });

    const deleted = await Bill.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ ok: false, error: "Bill not found" }, { status: 404 });

    return NextResponse.json({ ok: true, data: deleted });
  } catch (err) {
    console.error("DELETE /api/bills error", err);
    return NextResponse.json({ ok: false, error: "Failed to delete bill" }, { status: 500 });
  }
}