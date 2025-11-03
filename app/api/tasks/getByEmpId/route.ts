import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

export async function GET(req: Request) {
  await connectDB();

  try {
    const url = new URL(req.url);
    const empId = url.searchParams.get("empId");
    const name = url.searchParams.get("name");
    const project = url.searchParams.get("project");

    // if nothing is provided
    if (!empId && !name && !project) {
      return NextResponse.json(
        { error: "Please provide Employee ID, Name, or Project" },
        { status: 400 }
      );
    }

    // Build dynamic query
    const query: any = {};
    // Ensure case-insensitive exact match for empId
    if (empId) query.empId = { $regex: new RegExp(`^${empId}$`, "i") }; 
    if (name) query.name = { $regex: new RegExp(name, "i") }; 
    if (project) query.project = { $regex: new RegExp(project, "i") };

    // Fetch tasks based on combined filters.
    // NOTE: Because the Task model schema has been updated to include 
    // startDate, dueDate, endDate, and timeSpent, Task.find(query) 
    // will automatically retrieve these fields from the database.
    const tasks = await Task.find(query).sort({ date: -1 });

    if (tasks.length === 0) {
      return NextResponse.json(
        { message: "No tasks found for given filters", tasks: [] },
        { status: 200 }
      );
    }

    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}