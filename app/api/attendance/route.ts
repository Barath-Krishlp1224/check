import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance from "@/models/Attendance";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Uploads to S3 with structure: 
 * attendances / YYYY-MM-DD / Name-EmpID / punchType_timestamp.jpg
 */
async function uploadToS3(base64Data: string, date: string, empName: string, empId: string, punchType: string) {
  const buffer = Buffer.from(base64Data.replace(/^data:image\/\w+;base64,/, ""), "base64");
  
  // Format folder path: "John-Doe-LP001"
  const safeName = empName.toLowerCase().replace(/\s+/g, "-");
  const folderName = `${safeName}-${empId}`;
  
  const timestamp = Date.now();
  const fileName = `${punchType}_${timestamp}.jpg`;
  
  // Path: attendances/2025-12-30/john-doe-LP001/IN_1735555200.jpg
  const key = `attendances/${date}/${folderName}/${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
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
      imageData 
    } = await req.json();

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    // 1. Upload to S3 with Name/ID folder
    const imageUrl = await uploadToS3(
      imageData, 
      today, 
      employeeName || "unknown", 
      employeeId, 
      punchType
    );

    // 2. Database Update
    let attendance = await Attendance.findOne({ employeeId, date: today, mode });
    if (!attendance) {
      attendance = new Attendance({ employeeId, date: today, mode });
    }

    if (punchType === "IN") {
      attendance.punchInTime = now;
      attendance.punchInImage = imageUrl;
      attendance.punchInLatitude = latitude;
      attendance.punchInLongitude = longitude;
    } else {
      attendance.punchOutTime = now;
      attendance.punchOutImage = imageUrl;
      attendance.punchOutLatitude = latitude;
      attendance.punchOutLongitude = longitude;
    }

    await attendance.save();

    return NextResponse.json({ success: true, record: attendance });
  } catch (err: any) {
    console.error("Attendance API Error:", err);
    return NextResponse.json({ error: "Failed to process attendance" }, { status: 500 });
  }
}