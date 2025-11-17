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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const phoneRegex = /^[0-9]{10}$/;
const accountRegex = /^[0-9]{9,18}$/;

export async function POST(req: Request) {
  try {
    const data = await req.formData();

    const empId = data.get("empId")?.toString().trim().toUpperCase() || "";
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
    const ifscCode = data.get("ifscCode")?.toString().trim().toUpperCase() || "";
    const password = data.get("password")?.toString() || "";

    const photoFile = data.get("photo") as File | null;

    const requiredFields: Record<string, string> = {
      empId,
      name,
      fatherName,
      dateOfBirth,
      joiningDate,
      team,
      department,
      phoneNumber,
      mailId,
      accountNumber,
      ifscCode,
      password,
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return NextResponse.json(
          { success: false, message: `${key} is required.` },
          { status: 400 }
        );
      }
    }

    if (!category) {
      return NextResponse.json(
        { success: false, message: "category is required." },
        { status: 400 }
      );
    }

    if (team === "Tech" && category === "Developer" && (!subCategory || subCategory === "N/A")) {
      return NextResponse.json(
        { success: false, message: "Sub-Category is required for Developer team." },
        { status: 400 }
      );
    }

    if (!emailRegex.test(mailId))
      return NextResponse.json(
        { success: false, message: "Invalid email format." },
        { status: 400 }
      );

    if (!ifscRegex.test(ifscCode))
      return NextResponse.json(
        { success: false, message: "Invalid IFSC format." },
        { status: 400 }
      );

    if (!phoneRegex.test(phoneNumber))
      return NextResponse.json(
        { success: false, message: "Phone must be 10 digits." },
        { status: 400 }
      );

    if (!accountRegex.test(accountNumber))
      return NextResponse.json(
        { success: false, message: "Account number must be 9-18 digits." },
        { status: 400 }
      );

    let photoUrl = "";
    if (photoFile && photoFile.size > 0) {
      const arrayBuffer = await photoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = `${empId}_${uuidv4()}_${photoFile.name.replace(/\s/g, "_")}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: fileName,
          Body: buffer,
          ContentType: photoFile.type,
        })
      );

      photoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`;
    }

    // 🔐 HASH PASSWORD HERE
    const hashedPassword = await bcrypt.hash(password, 10);

    await connectDB();

    const existingEmp = await Employee.findOne({
      $or: [
        { empId: new RegExp(`^${empId}$`, "i") },
        { mailId: new RegExp(`^${mailId}$`, "i") },
      ],
    });

    if (existingEmp) {
      if (existingEmp.empId.toLowerCase() === empId.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: "Employee ID already exists." },
          { status: 409 }
        );
      }

      if (existingEmp.mailId.toLowerCase() === mailId.toLowerCase()) {
        return NextResponse.json(
          { success: false, message: "Email already registered." },
          { status: 409 }
        );
      }
    }

    const finalSubCategory =
      team === "Tech" && category === "Developer" ? subCategory : "";

    const newEmployee = new Employee({
      empId,
      name,
      fatherName,
      dateOfBirth,
      joiningDate,
      team,
      category,
      subCategory: finalSubCategory,
      department,
      phoneNumber,
      mailId,
      accountNumber,
      ifscCode,
      photo: photoUrl,
      password: hashedPassword,
      // role will default to "Employee" from schema
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
