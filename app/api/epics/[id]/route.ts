import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Epic from "@/models/Epic";
import mongoose from "mongoose";

// Define params type
type Params = Promise<{ id: string }>;

// GET: Fetch single epic by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Epic ID" }, { status: 400 });
    }

    const epic = await Epic.findById(id);
    if (!epic) {
      return NextResponse.json({ error: "Epic not found" }, { status: 404 });
    }

    return NextResponse.json(epic, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update an epic by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Epic ID" }, { status: 400 });
    }

    const existingEpic = await Epic.findById(id);
    if (!existingEpic) {
      return NextResponse.json({ error: "Epic not found" }, { status: 404 });
    }

    // Check for duplicate name (excluding current epic)
    if (body.name) {
      const duplicateEpic = await Epic.findOne({
        name: { $regex: new RegExp(`^${body.name.trim()}$`, "i") },
        projectId: existingEpic.projectId,
        _id: { $ne: id }
      });

      if (duplicateEpic) {
        return NextResponse.json(
          { error: `Another epic with the name "${body.name.trim()}" already exists in this project.` },
          { status: 400 }
        );
      }
    }

    // Validate and structure owner data if provided
    if (body.owner) {
      if (!body.owner._id || !body.owner.name) {
        return NextResponse.json(
          { error: "Owner must have both ID and name" },
          { status: 400 }
        );
      }
      
      // Ensure owner has proper structure
      body.owner = {
        _id: body.owner._id,
        name: body.owner.name,
        email: body.owner.email || ""
      };
    }

    // Validate and structure assignees data if provided
    if (body.assignees) {
      if (!Array.isArray(body.assignees)) {
        return NextResponse.json(
          { error: "Assignees must be an array" },
          { status: 400 }
        );
      }

      // Ensure each assignee has proper structure
      body.assignees = body.assignees.map((assignee: any) => ({
        _id: assignee._id,
        name: assignee.name,
        email: assignee.email || ""
      }));
    }

    // Remove _id from body to prevent update conflicts
    const { _id, ...updateData } = body;

    const updatedEpic = await Epic.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedEpic) {
      return NextResponse.json({ error: "Failed to update epic" }, { status: 500 });
    }

    return NextResponse.json(updatedEpic, { status: 200 });
  } catch (error: any) {
    console.error("Epic update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove an epic by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    await connectDB();
    const { id } = await params;

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