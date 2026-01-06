import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import mongoose from "mongoose";

// GET: Fetch all projects
export async function GET() {
  try {
    await connectDB();
    const projects = await Project.find().sort({ createdAt: -1 });
    return NextResponse.json(projects, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create a new project
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const normalizedKey = body.key?.toUpperCase();
    if (!normalizedKey) {
      return NextResponse.json({ error: "Project key is required" }, { status: 400 });
    }

    const existing = await Project.findOne({ key: normalizedKey });
    if (existing) {
      return NextResponse.json(
        { error: `Key "${normalizedKey}" is already assigned to another project.` }, 
        { status: 400 }
      );
    }

    const newProject = await Project.create({
      name: body.name,
      key: normalizedKey,
      description: body.description || "",
      ownerId: body.ownerId || "user_001",
      members: body.members || [],
      projectType: body.projectType || body.type || "Scrum",
      visibility: body.visibility || "PRIVATE"
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Edit and Save changes
// Fixed to accept ID within the body as your frontend sends it
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    
    // The frontend sends selectedProject._id
    const { _id, ...updateData } = body;

    if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
      return NextResponse.json({ error: "A valid Project ID is required" }, { status: 400 });
    }

    const updated = await Project.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error: any) {
    console.error("UPDATE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a project
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Project ID" }, { status: 400 });
    }

    const deleted = await Project.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Project deleted" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}