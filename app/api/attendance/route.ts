import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// --- GET Handler for Performance Dashboard ---
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const days = searchParams.get("days");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query: any = {};

    // 1. Filter by Date Range (Custom)
    if (from && to) {
      query.date = { $gte: from, $lte: to };
    } 
    // 2. Filter by Last X Days
    else if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      const dateString = startDate.toISOString().split("T")[0];
      query.date = { $gte: dateString };
    }

    const attendances = await Attendance.find(query).lean();

    // Map the database records to the "present" format expected by the frontend
    const formattedAttendances = attendances.map((att: any) => ({
      employeeId: att.employeeId,
      date: att.date,
      present: !!att.punchInTime, // If they punched in, they are considered present
    }));

    return NextResponse.json({ success: true, attendances: formattedAttendances });
  } catch (err: any) {
    console.error("Attendance Fetch Error:", err);
    return NextResponse.json({ error: "Failed to fetch attendance data" }, { status: 500 });
  }
}

// --- Existing POST Handler ---
async function uploadToS3(base64Data: string, date: string, empName: string, empId: string, punchType: string) {
  const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");
  const safeName = empName.toLowerCase().replace(/\s+/g, "-");
  const folderName = `${safeName}-${empId}`;
  const timestamp = Date.now();
  const fileName = `${punchType}_${timestamp}.jpg`;
  const key = `attendances/${date}/${folderName}/${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: "image/jpeg",
    })
  );

  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const { 
      employeeId, 
      employeeName, 
      punchType, 
      mode, 
      latitude, 
      longitude, 
      imageData,
      branch 
    } = await req.json();

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    const imageUrl = await uploadToS3(
      imageData, 
      today, 
      employeeName || "unknown", 
      employeeId, 
      punchType
    );

    let attendance = await Attendance.findOne({ employeeId, date: today, mode });
    if (!attendance) {
      attendance = new Attendance({ employeeId, date: today, mode });
    }

    if (punchType === "IN") {
      attendance.punchInTime = now;
      attendance.punchInImage = imageUrl;
      attendance.punchInLatitude = latitude;
      attendance.punchInLongitude = longitude;
      attendance.punchInBranch = branch;
    } else {
      attendance.punchOutTime = now;
      attendance.punchOutImage = imageUrl;
      attendance.punchOutLatitude = latitude;
      attendance.punchOutLongitude = longitude;
      attendance.punchOutBranch = branch;
    }

    await attendance.save();
    return NextResponse.json({ success: true, record: attendance });
  } catch (err: any) {
    console.error("Attendance POST Error:", err);
    return NextResponse.json({ error: "Failed to process attendance" }, { status: 500 });
  }
}