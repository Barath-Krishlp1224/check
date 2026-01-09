import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Epic from "@/models/Epic";
import mongoose from "mongoose";

// GET: Fetch epics for a project or single epic by ID
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const epicId = searchParams.get("epicId");

    // If epicId is provided, return single epic
    if (epicId) {
      if (!mongoose.Types.ObjectId.isValid(epicId)) {
        return NextResponse.json({ error: "Invalid Epic ID" }, { status: 400 });
      }
      
      const epic = await Epic.findById(epicId);
      if (!epic) {
        return NextResponse.json({ error: "Epic not found" }, { status: 404 });
      }
      return NextResponse.json(epic, { status: 200 });
    }

    // Otherwise, filter by projectId if provided
    let query = {};
    if (projectId) {
      query = { projectId };
    }

    const epics = await Epic.find(query).sort({ createdAt: -1 });
    return NextResponse.json(epics, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new epic
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: "Epic name is required" }, { status: 400 });
    }

    if (!body.summary || !body.summary.trim()) {
      return NextResponse.json({ error: "Epic summary is required" }, { status: 400 });
    }

    if (!body.projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    if (!body.owner || !body.owner._id || !body.owner.name) {
      return NextResponse.json({ error: "Epic owner with name is required" }, { status: 400 });
    }

    // Check for duplicate epic name in the same project
    const existingEpic = await Epic.findOne({
      name: { $regex: new RegExp(`^${body.name.trim()}$`, "i") },
      projectId: body.projectId
    });

    if (existingEpic) {
      return NextResponse.json(
        { error: `An epic with the name "${body.name.trim()}" already exists in this project.` },
        { status: 400 }
      );
    }

    // Auto-generate epic ID if not provided
    let epicId = body.epicId;
    if (!epicId) {
      const Project = (await import("@/models/Project")).default;
      const project = await Project.findById(body.projectId);
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      const epicCount = await Epic.countDocuments({ projectId: body.projectId });
      epicId = `${project.key.substring(0, 3)}-EPIC-${(epicCount + 1).toString().padStart(3, '0')}`;
    }

    // Validate assignees structure
    const assignees = body.assignees?.map((assignee: any) => ({
      _id: assignee._id,
      name: assignee.name,
      email: assignee.email || ""
    })) || [];

    // Create epic
    const newEpic = await Epic.create({
      epicId,
      name: body.name.trim(),
      summary: body.summary.trim(),
      description: body.description || "",
      status: body.status || "Todo",
      priority: body.priority || "Medium",
      startDate: body.startDate || new Date(),
      endDate: body.endDate || null,
      owner: {
        _id: body.owner._id,
        name: body.owner.name,
        email: body.owner.email || ""
      },
      assignees,
      labels: body.labels || [],
      projectId: body.projectId,
      projectName: body.projectName || "",
      createdBy: body.createdBy || "system",
    });

    return NextResponse.json(newEpic, { status: 201 });
  } catch (error: any) {
    console.error("Epic creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update an epic
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { _id, ...updateData } = body;

    if (!_id) {
      return NextResponse.json({ error: "Epic ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(_id)) {
      return NextResponse.json({ error: "Invalid Epic ID format" }, { status: 400 });
    }

    // Check for duplicate name (excluding current epic)
    if (updateData.name) {
      const existingEpic = await Epic.findOne({
        name: { $regex: new RegExp(`^${updateData.name.trim()}$`, "i") },
        projectId: body.projectId || (await Epic.findById(_id))?.projectId,
        _id: { $ne: _id }
      });

      if (existingEpic) {
        return NextResponse.json(
          { error: `Another epic with the name "${updateData.name.trim()}" already exists in this project.` },
          { status: 400 }
        );
      }
    }

    // Validate assignees structure if provided
    if (updateData.assignees) {
      updateData.assignees = updateData.assignees.map((assignee: any) => ({
        _id: assignee._id,
        name: assignee.name,
        email: assignee.email || ""
      }));
    }

    // Validate owner structure if provided
    if (updateData.owner) {
      if (!updateData.owner._id || !updateData.owner.name) {
        return NextResponse.json({ error: "Owner must have both ID and name" }, { status: 400 });
      }
    }

    const updatedEpic = await Epic.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEpic) {
      return NextResponse.json({ error: "Epic not found" }, { status: 404 });
    }

    return NextResponse.json(updatedEpic, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove an epic
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Epic ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Epic ID" }, { status: 400 });
    }

    const deleted = await Epic.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Epic not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      message: "Epic deleted successfully",
      deletedEpicId: deleted.epicId
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}