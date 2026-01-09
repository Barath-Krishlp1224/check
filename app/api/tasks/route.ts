import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Task from '@/models/Task';
import mongoose from 'mongoose';

// GET all tasks across all projects
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const assignee = searchParams.get('assignee');
    const department = searchParams.get('department');
    const limit = parseInt(searchParams.get('limit') || '50');
    const epicId = searchParams.get('epicId');
    const projectId = searchParams.get('projectId');

    let query: any = {};

    if (assignee) query.assigneeIds = assignee; // Updated to assigneeIds
    if (department) query.department = department;
    if (epicId) query.epicId = epicId;
    if (projectId) query.projectId = projectId;

    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new task
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    console.log('Received task data:', body); // Debug log
    
    // Validate required fields
    if (!body.summary || !body.issueType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: summary and issueType are required' },
        { status: 400 }
      );
    }

    // Generate task ID if not provided
    if (!body.taskId) {
      // Find the highest task number for this project/epic
      const lastTask = await Task.findOne({ 
        projectId: body.projectId 
      }).sort({ taskId: -1 });
      
      let taskNumber = 1;
      if (lastTask && lastTask.taskId) {
        const match = lastTask.taskId.match(/\d+$/);
        if (match) {
          taskNumber = parseInt(match[0]) + 1;
        }
      }
      
      body.taskId = `TASK-${taskNumber.toString().padStart(3, '0')}`;
    }

    // Generate issue key if not provided
    if (!body.issueKey && body.projectId && body.projectKey) {
      // Count tasks for this project to get next number
      const taskCount = await Task.countDocuments({ projectId: body.projectId });
      body.issueKey = `${body.projectKey}-${(taskCount + 1).toString().padStart(3, '0')}`;
    }

    // Get employee data if available to populate names
    let assigneeNames: string[] = [];
    let reporterNames: string[] = [];
    
    // In a real app, you would fetch employee names from Employee model
    // For now, we'll use placeholder or the provided names
    if (body.assigneeNames && Array.isArray(body.assigneeNames)) {
      assigneeNames = body.assigneeNames;
    }
    
    if (body.reporterNames && Array.isArray(body.reporterNames)) {
      reporterNames = body.reporterNames;
    }

    // Create task
    const taskData = {
      ...body,
      project: body.project || body.projectId,
      projectId: body.projectId,
      assigneeIds: body.assigneeIds || [], // Changed to assigneeIds
      reporterIds: body.reporterIds || [body.createdBy] || [], // Changed to reporterIds
      assigneeNames: assigneeNames,
      reporterNames: reporterNames,
      storyPoints: body.storyPoints || 0,
      labels: body.labels || [],
      duration: body.duration || 0,
      comments: body.comments || [],
      attachments: body.attachments || [],
      status: body.status || 'Todo',
      priority: body.priority || 'Medium',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Remove undefined fields
    Object.keys(taskData).forEach(key => {
      if (taskData[key] === undefined) {
        delete taskData[key];
      }
    });

    console.log('Creating task with data:', taskData); // Debug log
    
    const task = await Task.create(taskData);
    
    return NextResponse.json({
      success: true,
      data: task
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    console.error('Error details:', error.errors); // Debug log
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Task with this ID already exists' },
        { status: 409 }
      );
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { 
          success: false, 
          error: errors.join(', '),
          validationErrors: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create task' },
      { status: 500 }
    );
  }
}

// PUT - Update a task (using query parameter)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');
    
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }
    
    // Check if task exists
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Handle employee names if assigneeIds or reporterIds are updated
    let updateData = { ...body };
    
    if (body.assigneeIds && Array.isArray(body.assigneeIds)) {
      // In a real app, you would fetch employee names based on IDs
      // For now, we'll keep existing names or use provided ones
      if (!body.assigneeNames) {
        // Keep existing names or clear them
        updateData.assigneeNames = body.assigneeNames || [];
      }
    }
    
    if (body.reporterIds && Array.isArray(body.reporterIds)) {
      if (!body.reporterNames) {
        updateData.reporterNames = body.reporterNames || [];
      }
    }
    
    // Handle project field mapping if needed
    if (body.projectId && !body.project) {
      updateData.project = body.projectId;
    }
    
    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { 
        ...updateData, 
        updatedAt: new Date() 
      },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      data: updatedTask
    });
  } catch (error: any) {
    console.error('Error updating task:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a task (using query parameter)
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');
    
    if (!taskId) {
      return NextResponse.json(
        { success: false, error: 'Task ID is required' },
        { status: 400 }
      );
    }
    
    // Validate task ID
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID' },
        { status: 400 }
      );
    }
    
    // Check if task exists
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }
    
    // Delete task
    await Task.findByIdAndDelete(taskId);
    
    return NextResponse.json({
      success: true,
      message: 'Task deleted successfully',
      deletedId: taskId
    });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete task' },
      { status: 500 }
    );
  }
}