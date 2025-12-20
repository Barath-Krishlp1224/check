import { NextResponse } from "next/server";
import dbConnect from "@/lib/connectDB";
import Note from "@/models/Note";

// POST: Handles both Creating (New) and Updating (Edit)
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { id, userName, date, content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is empty" }, { status: 400 });
    }

    let result;

    if (id) {
      // EDIT MODE: If an ID exists, replace the content of that specific note
      result = await Note.findByIdAndUpdate(
        id,
        { content, date },
        { new: true }
      );
    } else {
      // NEW MODE: If no ID, create a brand new document
      result = await Note.create({
        userName,
        date,
        content,
        path: `notes/${userName}/${date}/${Date.now()}`,
      });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// GET: Fetch all notes for a specific user
export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const userName = searchParams.get("userName");

    if (!userName) return NextResponse.json({ error: "User Name required" }, { status: 400 });

    const notes = await Note.find({ userName }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, notes });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// DELETE: Remove a specific note by ID
export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await Note.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}