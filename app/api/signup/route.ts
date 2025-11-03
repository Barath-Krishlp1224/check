import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/connectDB"; 
import User from "@/models/User"; 

export async function POST(req: Request) {
  try {
    await connectDB();
    const { name, empId, email, password, role } = await req.json(); 

    if (!name || !empId || !email || !password || !role) {
      return NextResponse.json({ error: "All fields, including role, are required" }, { status: 400 });
    }

    const existingUser = await User.findOne({ $or: [{ empId }, { email }] });
    if (existingUser) {
      if (existingUser.empId === empId) {
        return NextResponse.json({ error: "Employee ID already registered" }, { status: 400 });
      }
      if (existingUser.email === email) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, empId, email, password: hashed, role }); 

    return NextResponse.json({ message: "Signup successful" }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}