import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

// Helper function to calculate task completion from subtasks recursively
function calculateTaskCompletion(task: any): number {
  // If task has manual completion, use it
  if (typeof task.completion === 'number' && task.completion > 0) {
    return task.completion;
  }

  // If no subtasks, return 0
  if (!task.subtasks || task.subtasks.length === 0) {
    return 0;
  }

  // Calculate average completion from all subtasks recursively
  const calculateSubtasksAvg = (subtasks: any[]): number => {
    if (!subtasks || subtasks.length === 0) return 0;

    let total = 0;
    let count = 0;

    subtasks.forEach((sub: any) => {
      const completion = typeof sub.completion === 'number' ? sub.completion : 0;
      total += completion;
      count++;

      // Add nested subtasks recursively
      if (sub.subtasks && sub.subtasks.length > 0) {
        const nested = calculateSubtasksAvg(sub.subtasks);
        total += nested * sub.subtasks.length;
        count += sub.subtasks.length;
      }
    });

    return count > 0 ? total / count : 0;
  };

  return Math.round(calculateSubtasksAvg(task.subtasks));
}

export async function GET(req: NextRequest) {
  await connectDB();

  try {
    const url = new URL(req.url);
    const assigneeName = url.searchParams.get("assigneeName");
    const days = url.searchParams.get("days");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");

    let query: any = {};
    
    // Filter by assignee name if provided
    if (assigneeName) {
      query.assigneeNames = {
        $regex: new RegExp(assigneeName, "i"),
      };
    }

    // Filter by date range if provided
    if (days) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      query.createdAt = { $gte: daysAgo };
    } else if (from && to) {
      query.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // For performance/hike calculation - include completion data
    const hikeTasks = tasks.map((t) => {
      // Calculate completion from subtasks if not set manually
      const calculatedCompletion = calculateTaskCompletion(t);
      
      return {
        _id: t._id,
        assigneeNames: t.assigneeNames || [],
        status: t.status,
        completion: calculatedCompletion, // Include calculated completion
        subtasks: t.subtasks || [], // Include subtasks for reference
        projectId: t.projectId,
        createdAt: t.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      tasks: hikeTasks,
    });
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  await connectDB();
  try {
    const data = await req.json();
    const newTask = new Task(data);
    await newTask.save();
    return NextResponse.json({ success: true, task: newTask });
  } catch (error: any) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create task" },
      { status: 500 }
    );
  }
}