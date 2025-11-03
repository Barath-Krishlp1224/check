import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Task from "@/models/Task"; // Make sure this path is correct

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/employeetasks";

export async function GET() {
  try {
    if (!mongoose.connection.readyState) {
      await mongoose.connect(MONGO_URI);
    }

    const tasks = await Task.find({}).lean();
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching all tasks:", error);
    return NextResponse.json({ error: "Failed to fetch all tasks" }, { status: 500 });
  }
}