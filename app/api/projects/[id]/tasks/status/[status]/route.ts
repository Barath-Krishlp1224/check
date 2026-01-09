import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';

// 1. Params must match folder names: [id] and [status]
// 2. Must be a Promise for Next.js 15
type RouteParams = Promise<{ id: string; status: string }>;

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    await connectDB();
    
    // 3. Await the params
    const { id, status } = await params;
    
    const tasks = await Task.find({
      projectId: id, // Use 'id' from the URL to query your 'projectId' field
      status: status
    }).sort({ dueDate: 1, priority: -1 });

    return NextResponse.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}