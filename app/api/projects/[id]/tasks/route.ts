// app/api/projects/[id]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import mongoose from 'mongoose';

// GET all tasks for a specific project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const issueType = searchParams.get('issueType');
    const assignee = searchParams.get('assignee');

    let query: any = { projectId: id };

    // Add filters if provided
    if (status) query.status = status;
    if (issueType) query.issueType = issueType;
    if (assignee) query.assigneeNames = assignee;

    const tasks = await Task.find(query).sort({ backlogOrder: 1, createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error: any) {
    console.error('Error fetching project tasks:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new task for a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.taskId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title and taskId are required' },
        { status: 400 }
      );
    }

    // Check if task with same taskId already exists in this project
    const existingTask = await Task.findOne({ 
      taskId: body.taskId, 
      projectId: id 
    });
    
    if (existingTask) {
      return NextResponse.json(
        { success: false, error: `Task with ID ${body.taskId} already exists in this project` },
        { status: 409 }
      );
    }

    // Create task with projectId from params
    const taskData = {
      ...body,
      projectId: id, // Use the id from URL params
      assigneeNames: body.assigneeNames || [],
      subtasks: body.subtasks || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const task = await Task.create(taskData);
    
    return NextResponse.json({
      success: true,
      data: task
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Bulk update tasks for a project (optional)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid project ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Validate request body
    if (!Array.isArray(body.tasks)) {
      return NextResponse.json(
        { success: false, error: 'Request body must contain a "tasks" array' },
        { status: 400 }
      );
    }
    
    // Update all tasks in the array
    const updatePromises = body.tasks.map((task: any) => 
      Task.findOneAndUpdate(
        { _id: task._id, projectId: id },
        { ...task, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
    );
    
    const updatedTasks = await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: `${updatedTasks.length} tasks updated successfully`,
      data: updatedTasks
    });
  } catch (error: any) {
    console.error('Error bulk updating tasks:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}