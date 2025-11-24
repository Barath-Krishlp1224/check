import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import os from "os";
import fs from "fs/promises";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export const runtime = "nodejs";

const REGION = String(process.env.AWS_REGION || "");
const BUCKET = String(process.env.S3_BUCKET || "");
const S3_PUBLIC = String(process.env.S3_PUBLIC || "false").toLowerCase() === "true";

let s3Client: S3Client | null = null;
if (BUCKET && REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
      secretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY),
    },
  });
}

async function uploadToS3(buffer: Buffer, filename: string, contentType = "application/octet-stream") {
  if (!s3Client || !BUCKET) throw new Error("S3 not configured");
  const key = `employees/${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${filename.replace(/\s+/g, "_")}`;
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ACL: S3_PUBLIC ? "public-read" : undefined,
  });
  await s3Client.send(cmd);
  if (S3_PUBLIC) {
    return { key, url: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodeURIComponent(key)}` };
  } else {
    return { key, url: `s3://${BUCKET}/${key}` };
  }
}

async function saveToTemp(buffer: Buffer, filename: string) {
  const tmpDir = path.join(os.tmpdir(), "uploads", "employees");
  await fs.mkdir(tmpDir, { recursive: true });
  const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}-${filename.replace(/\s+/g, "_")}`;
  const full = path.join(tmpDir, safe);
  await fs.writeFile(full, buffer);
  return { path: full, url: `file://${full}` };
}

async function saveFile(file: File | null) {
  if (!file) return { key: "", url: "" };
  const arr = await file.arrayBuffer();
  const buf = Buffer.from(arr);
  const name = file.name || `file-${Date.now()}`;
  if (s3Client && BUCKET && process.env.NODE_ENV === "production") {
    return await uploadToS3(buf, name, file.type || "application/octet-stream");
  } else {
    return await saveToTemp(buf, name);
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const form = await req.formData();

    const empId = String(form.get("empId") || "").trim();
    const name = String(form.get("name") || "").trim();
    const fatherName = String(form.get("fatherName") || "").trim();
    const dateOfBirth = String(form.get("dateOfBirth") || "").trim();
    const joiningDate = String(form.get("joiningDate") || "").trim();
    const team = String(form.get("team") || "").trim();
    const category = String(form.get("category") || "").trim();
    const subCategory = String(form.get("subCategory") || "").trim();
    const department = String(form.get("department") || "").trim();
    const phoneNumber = String(form.get("phoneNumber") || "").trim();
    const mailId = String(form.get("mailId") || "").trim().toLowerCase();
    const accountNumber = String(form.get("accountNumber") || "").trim();
    const ifscCode = String(form.get("ifscCode") || "").trim().toUpperCase();
    const password = String(form.get("password") || "");
    const employmentType = String(form.get("employmentType") || "").trim();

    const photo = form.get("photo") as unknown as File | null;
    const aadharFile = form.get("aadharFile") as unknown as File | null;
    const panFile = form.get("panFile") as unknown as File | null;
    const tenthMarksheet = form.get("tenthMarksheet") as unknown as File | null;
    const twelfthMarksheet = form.get("twelfthMarksheet") as unknown as File | null;
    const provisionalCertificate = form.get("provisionalCertificate") as unknown as File | null;
    const experienceCertificate = form.get("experienceCertificate") as unknown as File | null;

    if (!empId || !name || !mailId || !phoneNumber || !password) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const exists = await Employee.findOne({ $or: [{ empId }, { mailId }] });
    if (exists) {
      return NextResponse.json({ success: false, message: "Employee with this ID or email already exists" }, { status: 409 });
    }

    const [
      photoSaved,
      aadharSaved,
      panSaved,
      tenthSaved,
      twelfthSaved,
      provisionalSaved,
      experienceSaved,
    ] = await Promise.all([
      saveFile(photo),
      saveFile(aadharFile),
      saveFile(panFile),
      saveFile(tenthMarksheet),
      saveFile(twelfthMarksheet),
      saveFile(provisionalCertificate),
      saveFile(experienceCertificate),
    ]);

    const employee = await Employee.create({
      empId,
      name,
      fatherName,
      dateOfBirth,
      joiningDate,
      team: team || "Tech",
      category: category || "",
      subCategory: subCategory || "",
      department: department || team || "",
      phoneNumber,
      mailId,
      accountNumber,
      ifscCode,
      password,
      employmentType: employmentType === "Experienced" ? "Experienced" : "Fresher",
      photo: photoSaved.url || "",
      aadharDoc: aadharSaved.url || "",
      panDoc: panSaved.url || "",
      tenthMarksheet: tenthSaved.url || "",
      twelfthMarksheet: twelfthSaved.url || "",
      provisionalCertificate: provisionalSaved.url || "",
      experienceCertificate: experienceSaved.url || "",
      role: "Employee",
    });

    return NextResponse.json({ success: true, message: "Employee added", employee }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message || "Server error" }, { status: 500 });
  }
}
