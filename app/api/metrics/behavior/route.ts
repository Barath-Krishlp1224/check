import { NextResponse } from 'next/server';
import dbConnect from '@/lib/connectDB';
import { BehaviorMetric } from '@/models/BehaviorMetric';

export async function GET() {
  try {
    await dbConnect();
    
    const entries = await BehaviorMetric.find({}).sort({ createdAt: -1 });

    const latestScores = entries.reduce((acc: any[], current: any) => {
      const existing = acc.find(item => item.employeeId === current.employeeId);
      if (!existing) {
        acc.push({
          employeeId: current.employeeId,
          score: current.metrics?.behaviorScore || 100 
        });
      }
      return acc;
    }, []);

    return NextResponse.json(latestScores, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    
    const { employeeId, employeeName, formData } = body;

    if (!employeeId || !formData) {
      return NextResponse.json({ success: false, error: "Missing data" }, { status: 400 });
    }

    const newEntry = await BehaviorMetric.create({
      employeeId,
      employeeName,
      metrics: formData,
      score: formData.behaviorScore 
    });

    return NextResponse.json({ 
      success: true, 
      data: newEntry,
      behaviorScore: formData.behaviorScore 
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}