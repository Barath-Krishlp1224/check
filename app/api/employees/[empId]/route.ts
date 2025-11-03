// app/api/employees/[empId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnection from '@/lib/mongodb';
import Employee from '@/models/Employee';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const empId = url.pathname.split('/').pop();

    if (!empId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    await dbConnection();
    const employeeIdUpper = empId.toUpperCase();

    const employee = await Employee.findOne(
      { empId: employeeIdUpper },
      'name empId'
    ).lean();

    if (employee) {
      return NextResponse.json({ name: employee.name, empId: employee.empId }, { status: 200 });
    } else {
      return NextResponse.json({ error: `Employee ID ${empId} not found.` }, { status: 404 });
    }
  } catch (error) {
    console.error('Database query error:', error);
    return NextResponse.json({ error: 'Internal Server Error during DB operation 🚨' }, { status: 500 });
  }
}