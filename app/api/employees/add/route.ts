import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

export const config = {
  api: { bodyParser: false },
};

const s3 = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

async function uploadToS3(file: File, empId: string, label: string) {
  if (!file) return "";

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileName = `${label}_${uuidv4()}_${file.name.replace(/\s/g, "_")}`;
  const key = `Onboarding Documentation's/${empId || "UNKNOWN"}/${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })
  );

  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
}

export async function POST(req: Request) {
  try {
    const data = await req.formData();

    const empId = data.get("empId")?.toString().trim() || "";
    const name = data.get("name")?.toString().trim() || "";
    const fatherName = data.get("fatherName")?.toString().trim() || "";
    const dateOfBirth = data.get("dateOfBirth")?.toString() || "";
    const joiningDate = data.get("joiningDate")?.toString() || "";
    const team = data.get("team")?.toString() || "";
    const category = data.get("category")?.toString().trim() || "";
    const subCategory = data.get("subCategory")?.toString().trim() || "";
    const department = data.get("department")?.toString() || "";
    const phoneNumber = data.get("phoneNumber")?.toString() || "";
    const mailId = data.get("mailId")?.toString().trim().toLowerCase() || "";
    const accountNumber = data.get("accountNumber")?.toString() || "";
    const ifscCode = data.get("ifscCode")?.toString().trim() || "";
    const password = data.get("password")?.toString() || "";

    const employmentType = data.get("employmentType")?.toString() || "";

    const photoFile = data.get("photo") as File | null;
    const tenthMarksheet = data.get("tenthMarksheet") as File | null;
    const twelfthMarksheet = data.get("twelfthMarksheet") as File | null;
    const provisionalCertificate = data.get("provisionalCertificate") as File | null;
    const experienceCertificate = data.get("experienceCertificate") as File | null;

    // Upload only if files exist
    const photoUrl = photoFile ? await uploadToS3(photoFile, empId, "photo") : "";
    const tenthUrl = tenthMarksheet ? await uploadToS3(tenthMarksheet, empId, "10th") : "";
    const twelfthUrl = twelfthMarksheet ? await uploadToS3(twelfthMarksheet, empId, "12th") : "";
    const provisionalUrl = provisionalCertificate ? await uploadToS3(provisionalCertificate, empId, "provisional") : "";
    const experienceUrl = experienceCertificate ? await uploadToS3(experienceCertificate, empId, "experience") : "";

    const hashedPassword = password ? await bcrypt.hash(password, 10) : "";

    await connectDB();

    const newEmployee = new Employee({
      empId,
      name,
      fatherName,
      dateOfBirth,
      joiningDate,
      team,
      category,
      subCategory,
      department,
      phoneNumber,
      mailId,
      accountNumber,
      ifscCode,
      photo: photoUrl,
      password: hashedPassword,
      employmentType,
      tenthMarksheet: tenthUrl,
      twelfthMarksheet: twelfthUrl,
      provisionalCertificate: provisionalUrl,
      experienceCertificate: experienceUrl,
    });

    await newEmployee.save();

    return NextResponse.json({
      success: true,
      message: "Employee added successfully!",
      employeeId: newEmployee._id,
      photoUrl,
    });

  } catch (error: any) {
    console.error("Error adding employee:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
