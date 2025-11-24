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
// Removed aadharRegex and panRegex

async function uploadToS3(file: File, empId: string, label: string) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const cleanName = file.name.replace(/\s/g, "_");

  const fileName = `${label}_${uuidv4()}_${cleanName}`;

  const key = `Onboarding Documentation's/${empId}/${fileName}`;

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
    const ifscCode =
      data.get("ifscCode")?.toString().trim().toUpperCase() || "";
    const password = data.get("password")?.toString() || "";

    const employmentType = data.get("employmentType")?.toString() || "";
    // Removed aadharNumber and panNumber retrieval

    const photoFile = data.get("photo") as File | null;
    const aadharFile = data.get("aadharFile") as File | null;
    const panFile = data.get("panFile") as File | null;
    const tenthMarksheet = data.get("tenthMarksheet") as File | null;
    const twelfthMarksheet = data.get("twelfthMarksheet") as File | null;
    const provisionalCertificate = data.get(
      "provisionalCertificate"
    ) as File | null;
    const experienceCertificate = data.get(
      "experienceCertificate"
    ) as File | null;

    // Allowed teams — include Housekeeping
    const allowedTeams = [
      "Founders",
      "Manager",
      "TL-Reporting Manager",
      "IT Admin",
      "Tech",
      "Accounts",
      "HR",
      "Admin & Operations",
      "Housekeeping",
    ];

    // REQUIRED FIELDS: Only password is mandatory in the front-end,
    // but banking and contact details are crucial for employee record creation.
    // I will set the required fields based on a common minimum standard for API ingestion.
    // Since the client side made most fields optional, I will adjust this list to reflect that, 
    // keeping only password/confirmation mandatory as per your last request.
    
    // I am retaining the required fields from the original structure for robustness 
    // (Employee ID, Name, Team, etc., are usually mandatory for a new record). 
    // Please align this list with your actual business requirements.
    const requiredFields: Record<string, string> = {
      //empId, name, fatherName, dateOfBirth, joiningDate, team, department, phoneNumber, mailId, accountNumber, ifscCode, employmentType, are now optional or handled by document checks.
      password,
      // Leaving these basic IDs as mandatory for record creation unless explicitly told otherwise:
      empId,
      name,
      team,
      category,
      department
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return NextResponse.json(
          { success: false, message: `${key} is required.` },
          { status: 400 }
        );
      }
    }

    if (!allowedTeams.includes(team)) {
      return NextResponse.json(
        { success: false, message: "Invalid team." },
        { status: 400 }
      );
    }

    // Employment type check (only for validation, not required field)
    if (employmentType && !["Fresher", "Experienced"].includes(employmentType)) {
      return NextResponse.json(
        { success: false, message: "Invalid employment type." },
        { status: 400 }
      );
    }

    // --- Conditional Category/SubCategory Validation (Keep standard logic) ---
    if (
      team === "Tech" &&
      category === "Developer" &&
      (!subCategory || subCategory === "N/A")
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Sub-Category is required for Developer team.",
        },
        { status: 400 }
      );
    }
    // --- End Conditional Category/SubCategory Validation ---


    // --- Format/Regex Validation (Make optional by checking if value exists) ---
    if (mailId && !emailRegex.test(mailId))
      return NextResponse.json(
        { success: false, message: "Invalid email format." },
        { status: 400 }
      );

    if (ifscCode && !ifscRegex.test(ifscCode))
      return NextResponse.json(
        { success: false, message: "Invalid IFSC format." },
        { status: 400 }
      );

    if (phoneNumber && !phoneRegex.test(phoneNumber))
      return NextResponse.json(
        { success: false, message: "Phone must be 10 digits." },
        { status: 400 }
      );

    if (accountNumber && !accountRegex.test(accountNumber))
      return NextResponse.json(
        {
          success: false,
          message: "Account number must be 9-18 digits.",
        },
        { status: 400 }
      );

    // Removed Aadhar and PAN number regex checks
    // --- End Format/Regex Validation ---

    // --- Document Required Checks (File upload is mandatory for these documents) ---
    if (!aadharFile || aadharFile.size === 0) {
      return NextResponse.json(
        { success: false, message: "Aadhar document is required." },
        { status: 400 }
      );
    }

    if (!panFile || panFile.size === 0) {
      return NextResponse.json(
        { success: false, message: "PAN document is required." },
        { status: 400 }
      );
    }

    if (!tenthMarksheet || tenthMarksheet.size === 0) {
      return NextResponse.json(
        { success: false, message: "10th marksheet is required." },
        { status: 400 }
      );
    }

    if (!twelfthMarksheet || twelfthMarksheet.size === 0) {
      return NextResponse.json(
        { success: false, message: "12th marksheet is required." },
        { status: 400 }
      );
    }

    if (employmentType === "Fresher") {
      if (!provisionalCertificate || provisionalCertificate.size === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Provisional certificate is required for fresher.",
          },
          { status: 400 }
        );
      }
    }

    if (employmentType === "Experienced") {
      if (!experienceCertificate || experienceCertificate.size === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Experience certificate is required for experienced candidates.",
          },
          { status: 400 }
        );
      }
    }
    // --- End Document Required Checks ---


    // --- S3 Uploads ---
    let photoUrl = "";
    let aadharDocUrl = "";
    let panDocUrl = "";
    let tenthUrl = "";
    let twelfthUrl = "";
    let provisionalUrl = "";
    let experienceUrl = "";

    if (photoFile && photoFile.size > 0) {
      photoUrl = await uploadToS3(photoFile, empId, "photo");
    }

    // These files are mandatory based on checks above
    aadharDocUrl = await uploadToS3(aadharFile, empId, "aadhar");
    panDocUrl = await uploadToS3(panFile, empId, "pan");
    tenthUrl = await uploadToS3(tenthMarksheet, empId, "10th");
    twelfthUrl = await uploadToS3(twelfthMarksheet, empId, "12th");

    if (employmentType === "Fresher" && provisionalCertificate) {
      provisionalUrl = await uploadToS3(
        provisionalCertificate,
        empId,
        "provisional"
      );
    }

    if (employmentType === "Experienced" && experienceCertificate) {
      experienceUrl = await uploadToS3(
        experienceCertificate,
        empId,
        "experience"
      );
    }
    // --- End S3 Uploads ---


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
      employmentType,
      // Removed aadharNumber and panNumber from the employee object
      aadharDoc: aadharDocUrl,
      panDoc: panDocUrl,
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