import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb'; // Ensure this matches your export (default vs named)
import Task from '@/models/Task';

// 1. Define the interface to match folder names: [id] and [taskId]
// 2. Wrap it in a Promise for Next.js 15 compatibility
type RouteParams = Promise<{ id: string; taskId: string }>;

// GET single task
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    await connectDB();
    
    // Await the params
    const { id, taskId } = await params;
    
    const task = await Task.findOne({
      projectId: id, // Mapping the folder [id] to your DB field 'projectId'
      taskId: taskId
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    await connectDB();
    
    const { id, taskId } = await params;
    const body = await request.json();
    
    const task = await Task.findOneAndUpdate(
      { projectId: id, taskId: taskId },
      body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE task
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    await connectDB();
    
    const { id, taskId } = await params;
    
    const task = await Task.findOneAndDelete({
      projectId: id,
      taskId: taskId
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}