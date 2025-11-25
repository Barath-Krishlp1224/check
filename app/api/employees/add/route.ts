// app/api/employees/add/route.ts
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { connectToDatabase } from "@/lib/mongoose";
import Employee from "@/models/Employee";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

/* ---------- S3 / temp storage setup (same logic you used) ---------- */
const REGION = String(process.env.S3_REGION || "");
const BUCKET = String(process.env.S3_BUCKET_NAME || "");
const S3_PUBLIC = String(process.env.S3_PUBLIC || "false").toLowerCase() === "true";

let s3Client: S3Client | null = null;
if (BUCKET && REGION && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  try {
    s3Client = new S3Client({
      region: REGION,
      credentials: {
        accessKeyId: String(process.env.AWS_ACCESS_KEY_ID),
        secretAccessKey: String(process.env.AWS_SECRET_ACCESS_KEY),
      },
    });
    console.log("S3 client initialized");
  } catch (e) {
    console.error("S3 init error:", (e as Error).message);
    s3Client = null;
  }
} else {
  console.warn("S3 not configured or missing envs; falling back to temp storage");
}

async function uploadToS3(buffer: Buffer, empId: string, filename: string, contentType = "application/octet-stream") {
  if (!s3Client || !BUCKET) throw new Error("S3 not configured");
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${filename.replace(/\s+/g, "_")}`;
  const key = `onboarding_documents/${encodeURIComponent(String(empId))}/documents/${safeName}`;
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

async function saveToTemp(buffer: Buffer, empId: string, filename: string) {
  const tmpDir = path.join(os.tmpdir(), "uploads", "onboarding_documents", String(empId), "documents");
  await fs.mkdir(tmpDir, { recursive: true });
  const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}-${filename.replace(/\s+/g, "_")}`;
  const full = path.join(tmpDir, safe);
  await fs.writeFile(full, buffer);
  return { path: full, url: `file://${full}` };
}

async function saveFile(file: File | null, empId: string) {
  if (!file) return { key: "", url: "" };
  const arr = await file.arrayBuffer();
  const buf = Buffer.from(arr);
  const name = (file as any).name || `file-${Date.now()}`;
  try {
    if (s3Client && BUCKET) {
      const res = await uploadToS3(buf, empId, name, (file as any).type || "application/octet-stream");
      console.log("Uploaded to S3:", res.url);
      return res;
    } else {
      const res = await saveToTemp(buf, empId, name);
      console.log("Saved to temp:", res.path);
      return { key: "", url: res.url };
    }
  } catch (err: any) {
    console.error("saveFile error:", err?.message || err);
    if (s3Client && BUCKET) {
      try {
        const fallback = await saveToTemp(buf, empId, name);
        return { key: "", url: fallback.url };
      } catch (e) {
        throw e;
      }
    }
    throw err;
  }
}

/* ---------- Simple welcome-email helper (Nodemailer) ---------- */
async function sendWelcomeEmailSMTP(to: string, params: { name?: string; empId?: string; joiningDate?: string; team?: string }) {
  const SMTP_HOST = process.env.SMTP_HOST;
  const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;
  const EMAIL_FROM = process.env.EMAIL_FROM || "No Reply <no-reply@example.com>";

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP not configured (SMTP_HOST / SMTP_USER / SMTP_PASS required)");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const subject = `Welcome to Company — ${params.name || ""}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.5; color:#111;">
      <h2>Welcome ${params.name || ""} 👋</h2>
      <p>Hi ${params.name || ""},</p>
      <p>Welcome to the ${params.team || "team"}! Your onboarding record has been created.</p>
      <p><strong>Employee ID:</strong> ${params.empId || "—"}</p>
      <p><strong>Joining Date:</strong> ${params.joiningDate || "—"}</p>
      <p>Further instructions will be shared by HR.</p>
      <p>Best,<br/>People Ops</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  return info;
}

/* ---------- POST handler ---------- */
export async function POST(req: Request) {
  await connectToDatabase();
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
    const passwordRaw = String(form.get("password") || "");
    const employmentType = String(form.get("employmentType") || "").trim();

    const photo = form.get("photo") as unknown as File | null;
    const aadharFile = form.get("aadharFile") as unknown as File | null;
    const panFile = form.get("panFile") as unknown as File | null;
    const tenthMarksheet = form.get("tenthMarksheet") as unknown as File | null;
    const twelfthMarksheet = form.get("twelfthMarksheet") as unknown as File | null;
    const provisionalCertificate = form.get("provisionalCertificate") as unknown as File | null;
    const experienceCertificate = form.get("experienceCertificate") as unknown as File | null;

    if (!empId || !name || !mailId || !phoneNumber || !passwordRaw) {
      return NextResponse.json({ success: false, message: "Missing required fields (empId, name, mailId, phoneNumber, password)" }, { status: 400 });
    }

    // check duplicates
    const exists = await Employee.findOne({ $or: [{ empId }, { mailId }] });
    if (exists) {
      return NextResponse.json({ success: false, message: "Employee with this ID or email already exists" }, { status: 409 });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(passwordRaw, salt);

    // save files (S3 or temp)
    const filesToSave = [photo, aadharFile, panFile, tenthMarksheet, twelfthMarksheet, provisionalCertificate, experienceCertificate];

    const savedResults = await Promise.all(
      filesToSave.map(async (f) => {
        try {
          const r = await saveFile(f, empId);
          return { ok: true, url: r.url || "", key: (r as any).key || "" };
        } catch (err: any) {
          return { ok: false, error: err?.message || String(err) };
        }
      })
    );

    const [photoSaved, aadharSaved, panSaved, tenthSaved, twelfthSaved, provisionalSaved, experienceSaved] = savedResults;

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
      password: hashed,
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

    // send welcome email — don't fail the whole request on email error
    let emailResult: any = null;
    try {
      emailResult = await sendWelcomeEmailSMTP(employee.mailId, {
        name: employee.name,
        empId: employee.empId,
        joiningDate: employee.joiningDate,
        team: employee.team,
      });
    } catch (mailErr) {
      console.error("Failed to send welcome email:", mailErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Employee added",
        employee: {
          _id: employee._id,
          empId: employee.empId,
          name: employee.name,
          mailId: employee.mailId,
          team: employee.team,
        },
        fileStatus: savedResults,
        emailSent: !!emailResult,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /employees/add error:", err?.stack || err?.message || err);
    const message = err?.message || "Server error while adding employee";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
