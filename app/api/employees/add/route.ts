import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";

export const runtime = "nodejs";

async function saveUploadedFile(file: File | null, dir: string) {
  if (!file) return "";

  await fs.mkdir(dir, { recursive: true });
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
  const filepath = path.join(dir, filename);

  await fs.writeFile(filepath, buffer);

  return `/uploads/employees/${filename}`;
}

export async function POST(req: Request) {
  await connectDB();

  try {
    const form = await req.formData();

    const empId = String(form.get("empId") || "");
    const name = String(form.get("name") || "");
    const fatherName = String(form.get("fatherName") || "");
    const dateOfBirth = String(form.get("dateOfBirth") || "");
    const joiningDate = String(form.get("joiningDate") || "");
    const team = String(form.get("team") || "");
    const category = String(form.get("category") || "");
    const subCategory = String(form.get("subCategory") || "");
    const department = String(form.get("department") || "");
    const phoneNumber = String(form.get("phoneNumber") || "");
    const mailId = String(form.get("mailId") || "").toLowerCase();
    const accountNumber = String(form.get("accountNumber") || "");
    const ifscCode = String(form.get("ifscCode") || "").toUpperCase();
    const password = String(form.get("password") || "");
    const employmentType = String(form.get("employmentType") || "");

    const photo = form.get("photo") as unknown as File;
    const aadharFile = form.get("aadharFile") as unknown as File;
    const panFile = form.get("panFile") as unknown as File;
    const tenthMarksheet = form.get("tenthMarksheet") as unknown as File;
    const twelfthMarksheet = form.get("twelfthMarksheet") as unknown as File;
    const provisionalCertificate = form.get("provisionalCertificate") as unknown as File;
    const experienceCertificate = form.get("experienceCertificate") as unknown as File;

    if (!empId || !name || !mailId || !phoneNumber || !password) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const exists = await Employee.findOne({ $or: [{ empId }, { mailId }] });
    if (exists) {
      return NextResponse.json(
        { success: false, message: "Employee with this ID or email already exists" },
        { status: 409 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "employees");

    const photoPath = await saveUploadedFile(photo, uploadDir);
    const aadharPath = await saveUploadedFile(aadharFile, uploadDir);
    const panPath = await saveUploadedFile(panFile, uploadDir);
    const tenthPath = await saveUploadedFile(tenthMarksheet, uploadDir);
    const twelfthPath = await saveUploadedFile(twelfthMarksheet, uploadDir);
    const provisionalPath = await saveUploadedFile(provisionalCertificate, uploadDir);
    const experiencePath = await saveUploadedFile(experienceCertificate, uploadDir);

    const employee = await Employee.create({
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
      password,
      employmentType,
      photo: photoPath,
      aadharDoc: aadharPath,
      panDoc: panPath,
      tenthMarksheet: tenthPath,
      twelfthMarksheet: twelfthPath,
      provisionalCertificate: provisionalPath,
      experienceCertificate: experiencePath,
      role: "Employee",
    });

    return NextResponse.json({ success: true, message: "Employee Added", employee });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
