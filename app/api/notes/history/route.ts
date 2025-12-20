import { NextResponse } from "next/server";
import dbConnect from "@/lib/connectDB";
import Note from "@/models/Note";

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