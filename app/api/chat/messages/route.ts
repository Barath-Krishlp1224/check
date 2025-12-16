import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Message from "@/models/Message";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");

  if (!roomId) return NextResponse.json([]);

  await connectDB();

  const messages = await Message.find({ roomId })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json(messages);
}
