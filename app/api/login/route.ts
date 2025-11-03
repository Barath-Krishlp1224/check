// app/api/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/connectDB";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { empIdOrEmail, password } = await req.json();

    if (!empIdOrEmail || !password) {
      return NextResponse.json(
        { error: "Identifier and password are required" },
        { status: 400 }
      );
    }

    // Normalize input
    const identifier = empIdOrEmail.trim();

    // Case-insensitive query for empId or email
    const user = await User.findOne({
      $or: [
        { empId: { $regex: new RegExp("^" + identifier + "$", "i") } },
        { email: { $regex: new RegExp("^" + identifier + "$", "i") } },
      ],
    });

    if (!user) {
      console.log("❌ User not found for:", identifier);
      return NextResponse.json(
        { error: "User not found or invalid identifier" },
        { status: 404 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log("❌ Invalid password for user:", identifier);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log("✅ Login success:", user.empId);

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          name: user.name,
          empId: user.empId,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}