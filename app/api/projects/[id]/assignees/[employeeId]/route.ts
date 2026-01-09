import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';
import mongoose from 'mongoose';

// Define the type for the params promise
type RouteParams = Promise<{ id: string; employeeId: string }>;

export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams } // Params is now a Promise
) {
  try {
    await connectDB();
    
    // 1. Await the params to get the IDs
    const { id, employeeId } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }
    
    // 2. Remove from assigneeIds array
    project.assigneeIds = project.assigneeIds?.filter((aId: any) => 
      aId.toString() !== employeeId
    ) || [];
    
    // 3. Remove from members array (except if they are the owner)
    project.members = project.members?.filter((member: any) => {
      // Don't remove if this is the owner
      if (project.ownerId?.toString() === employeeId) {
        return true;
      }
      // Remove if userId matches employeeId
      return member.userId?.toString() !== employeeId;
    }) || [];
    
    project.updatedAt = new Date();
    await project.save();
    
    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Error removing assignee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove assignee' },
      { status: 500 }
    );
  }
} 