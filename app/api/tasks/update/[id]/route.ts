import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const taskId = url.pathname.split("/").pop()?.trim();

    if (!taskId) {
      return NextResponse.json(
        { success: false, message: "Task ID is required." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const requiredFields = ["project", "completion", "status"];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === "") {
        return NextResponse.json(
          { success: false, message: `${field} is required.` },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      project: body.project,
      plan: body.plan ?? "",
      done: body.done ?? "",
      completion: Number(body.completion),
      status: body.status,
      remarks: body.remarks ?? "",
      // Task-level date/time fields
      startDate: body.startDate ?? "",
      dueDate: body.dueDate ?? "",
      endDate: body.endDate ?? "",
      timeSpent: body.timeSpent ?? "",
    };

    // ✅ UPDATED SUBTASK MAPPING
    if (Array.isArray(body.subtasks)) {
      updateData.subtasks = body.subtasks.map((st: any) => ({
        title: st.title?.trim() || "",
        status: st.status || "Pending",
        completion: Number(st.completion) || 0,
        remarks: st.remarks?.trim() || "",
        // 🆕 PULLING NEW SUBTASK FIELDS FROM BODY
        startDate: st.startDate ?? "", 
        dueDate: st.dueDate ?? "",
        endDate: st.endDate ?? "",
        timeSpent: st.timeSpent ?? "",
      }));
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return NextResponse.json(
        { success: false, message: "Task not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Task updated successfully.", task: updatedTask },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Task update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}