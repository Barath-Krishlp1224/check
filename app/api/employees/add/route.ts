import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: { bodyParser: false },
};

// 🔹 Initialize AWS S3 Client
const s3 = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// ✅ Utility regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const phoneRegex = /^[0-9]{10}$/;
const accountRegex = /^[0-9]{9,18}$/;

export async function POST(req: Request) {
  try {
    const data = await req.formData();

    // 🔹 Extract all fields
    const empId = data.get("empId")?.toString().trim().toUpperCase() || "";
    const name = data.get("name")?.toString().trim() || "";
    const fatherName = data.get("fatherName")?.toString().trim() || "";
    const dateOfBirth = data.get("dateOfBirth")?.toString() || "";
    const joiningDate = data.get("joiningDate")?.toString() || "";
    const team = data.get("team")?.toString() || "";
    // Note: category and subCategory are now required fields in the client, but their content needs dynamic validation.
    const category = data.get("category")?.toString().trim() || "";
    const subCategory = data.get("subCategory")?.toString().trim() || ""; // Could be "N/A"
    const department = data.get("department")?.toString() || "";
    const phoneNumber = data.get("phoneNumber")?.toString() || "";
    const mailId = data.get("mailId")?.toString().trim().toLowerCase() || "";
    const accountNumber = data.get("accountNumber")?.toString() || "";
    const ifscCode = data.get("ifscCode")?.toString().trim().toUpperCase() || "";

    const photoFile = data.get("photo") as File | null;

    // 🔹 Validate general required fields
    // We remove 'category' and 'subCategory' from this generic check because the client side ensures they have *a* value.
    const requiredFields = {
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
    };

    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        return NextResponse.json(
          { success: false, message: `${key} is required.` },
          { status: 400 }
        );
      }
    }
    
    // ✅ NEW: Validate 'category' and 'subCategory' based on client logic
    if (!category) {
        return NextResponse.json(
            { success: false, message: "category is required." },
            { status: 400 }
        );
    }

    // ⚠️ UPDATED: SubCategory is ONLY required if team is "Tech" AND category is "Developer"
    // And, it must NOT be "N/A" (which the client uses as a placeholder for non-applicable)
    if (team === "Tech" && category === "Developer" && (!subCategory || subCategory === "N/A")) {
      return NextResponse.json(
        { success: false, message: "Sub-Category is required for Developer team." },
        { status: 400 }
      );
    }
    
    // If subCategory is present but NOT applicable, ensure it's "N/A" (as per client logic)
    // Otherwise, we'll strip the 'N/A' placeholder before saving to the DB.
    
    // 🔹 Validate formats
    if (!emailRegex.test(mailId))
      return NextResponse.json({ success: false, message: "Invalid email format." }, { status: 400 });
    if (!ifscRegex.test(ifscCode))
      return NextResponse.json({ success: false, message: "Invalid IFSC format." }, { status: 400 });
    if (!phoneRegex.test(phoneNumber))
      return NextResponse.json({ success: false, message: "Phone must be 10 digits." }, { status: 400 });
    if (!accountRegex.test(accountNumber))
      return NextResponse.json({ success: false, message: "Account number must be 9-18 digits." }, { status: 400 });

    // 🔹 Upload photo to S3
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

    // 🔹 Connect DB
    await connectDB();

    // 🔹 Duplicate checks
    const existingEmp = await Employee.findOne({
      $or: [{ empId: new RegExp(`^${empId}$`, "i") }, { mailId: new RegExp(`^${mailId}$`, "i") }],
    });

    if (existingEmp) {
      if (existingEmp.empId.toLowerCase() === empId.toLowerCase())
        return NextResponse.json({ success: false, message: "Employee ID already exists." }, { status: 409 });

      if (existingEmp.mailId.toLowerCase() === mailId.toLowerCase())
        return NextResponse.json({ success: false, message: "Email already registered." }, { status: 409 });
    }

    // ✅ NEW: Clean up subCategory before saving (replace "N/A" with empty string)
    const finalSubCategory = (team === "Tech" && category === "Developer") ? subCategory : "";
    
    // 🔹 Create new employee (include category/subCategory)
    const newEmployee = new Employee({
      empId,
      name,
      fatherName,
      dateOfBirth,
      joiningDate,
      team,
      category: category,
      subCategory: finalSubCategory, // Use the cleaned value
      department,
      phoneNumber,
      mailId,
      accountNumber,
      ifscCode,
      photo: photoUrl,
    });

    await newEmployee.save();

    return NextResponse.json({
      success: true,
      message: "Employee added successfully!",
      employeeId: newEmployee._id,
      photoUrl,
    });
  } catch (error: any) {
    console.error("❌ Error adding employee:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}