// app/api/attendance/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Attendance, { AttendanceMode } from "@/models/Attendance";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PunchType = "IN" | "OUT";

// 👉 MAIN OFFICE LOCATION (your coordinates)
const OFFICE_LOCATION = {
  lat: 11.93899, 
  lng: 79.81667,
};

// 👉 Max allowed distance for IN_OFFICE punches (in meters)
const MAX_OFFICE_DISTANCE_METERS = 200; // adjust as you like

// ✅ Env setup
const S3_REGION = process.env.S3_REGION || process.env.AWS_REGION;
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const ACCESS_KEY_ID =
  process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY =
  process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

// 🔹 Quick sanity check – fail early if misconfigured
function ensureS3Env() {
  if (!S3_REGION) throw new Error("S3 region is not configured.");
  if (!S3_BUCKET_NAME) throw new Error("S3 bucket name is not configured.");
  if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new Error("S3/AWS access key or secret is not configured.");
  }
}

let s3: S3Client | null = null;

function getS3Client() {
  if (!s3) {
    ensureS3Env();
    s3 = new S3Client({
      region: S3_REGION!,
      credentials: {
        accessKeyId: ACCESS_KEY_ID!,
        secretAccessKey: SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3;
}

// 🔹 Utility: get only the date (00:00:00)
function getTodayDateOnly() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// 🔹 Distance helpers (Haversine formula)
function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 🔹 Utility: upload base64 Data URL to S3 and return URL
async function uploadImageDataUrlToS3(
  dataUrl: string,
  keyPrefix: string,
  punchType: PunchType
): Promise<string> {
  const [meta, base64Data] = dataUrl.split(",");
  if (!base64Data) {
    throw new Error("Invalid image data URL: missing base64 part.");
  }

  const mimeMatch = meta.match(/data:(.*);base64/);
  const contentType = mimeMatch?.[1] || "image/jpeg";

  const buffer = Buffer.from(base64Data, "base64");

  const fileExtension =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
      ? "webp"
      : "jpg";

  const fileName =
    punchType === "IN"
      ? `punchin-${Date.now()}.${fileExtension}`
      : `punchout-${Date.now()}.${fileExtension}`;

  const key = `${keyPrefix}/${fileName}`;

  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  try {
    await client.send(command);
  } catch (err: any) {
    console.error("S3 PutObject error:", err);
    throw new Error(
      `S3 upload failed: ${err?.message || "Unknown S3 error"}`
    );
  }

  const url = `https://${S3_BUCKET_NAME}.s3.${S3_REGION}.amazonaws.com/${key}`;
  return url;
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const {
      employeeId,
      imageData,
      latitude,
      longitude,
      punchType,
      mode,
      // optional extras (currently unused, but kept for future)
      role,
      team,
      name,
    } = body as {
      employeeId?: string;
      imageData?: string;
      latitude?: number | null;
      longitude?: number | null;
      punchType?: PunchType;
      mode?: AttendanceMode;
      role?: string;
      team?: string;
      name?: string;
    };

    // Basic validation
    if (!employeeId || !imageData || !punchType) {
      return NextResponse.json(
        { error: "employeeId, imageData and punchType are required." },
        { status: 400 }
      );
    }

    if (punchType !== "IN" && punchType !== "OUT") {
      return NextResponse.json(
        { error: "Invalid punchType. Use 'IN' or 'OUT'." },
        { status: 400 }
      );
    }

    const attendanceMode: AttendanceMode = mode || "IN_OFFICE";
    const today = getTodayDateOnly();
    const dateStr = today.toISOString().slice(0, 10);

    // 👉 LOCATION VALIDATION for IN_OFFICE
    let distanceFromOfficeMeters: number | null = null;

    if (attendanceMode === "IN_OFFICE") {
      if (latitude == null || longitude == null) {
        return NextResponse.json(
          {
            error:
              "Location is required for In Office attendance. Please allow location access.",
          },
          { status: 400 }
        );
      }

      distanceFromOfficeMeters = haversineDistanceMeters(
        latitude,
        longitude,
        OFFICE_LOCATION.lat,
        OFFICE_LOCATION.lng
      );

      if (distanceFromOfficeMeters > MAX_OFFICE_DISTANCE_METERS) {
        return NextResponse.json(
          {
            error:
              "You are too far from the office location for an In Office punch.",
            distanceMeters: Math.round(distanceFromOfficeMeters),
            allowedMeters: MAX_OFFICE_DISTANCE_METERS,
          },
          { status: 400 }
        );
      }
    } else {
      // For other modes, we just compute distance if we have location (for info)
      if (latitude != null && longitude != null) {
        distanceFromOfficeMeters = haversineDistanceMeters(
          latitude,
          longitude,
          OFFICE_LOCATION.lat,
          OFFICE_LOCATION.lng
        );
      }
    }

    const modeFolder = attendanceMode.toLowerCase();
    const keyPrefix = `attendance/${dateStr}/${employeeId}/${modeFolder}`;

    // 🔹 Upload image to S3
    let imageUrl: string;
    try {
      imageUrl = await uploadImageDataUrlToS3(
        imageData,
        keyPrefix,
        punchType
      );
    } catch (uploadErr: any) {
      console.error("S3 upload error (wrapped):", uploadErr);
      return NextResponse.json(
        {
          error: "Failed to upload image to storage.",
          details: uploadErr?.message || "Unknown error",
        },
        { status: 500 }
      );
    }

    // 🔹 Find or create attendance doc for this employee + date + mode
    let attendance = await Attendance.findOne({
      employeeId,
      date: today,
      mode: attendanceMode,
    });

    if (!attendance) {
      attendance = new Attendance({
        employeeId,
        date: today,
        mode: attendanceMode,
      });
    }

    const now = new Date();

    if (punchType === "IN") {
      if (attendance.punchInTime) {
        return NextResponse.json(
          { error: "Already punched in for today for this mode." },
          { status: 400 }
        );
      }

      attendance.punchInTime = now;
      attendance.punchInImage = imageUrl;
      attendance.punchInLatitude = latitude ?? undefined;
      attendance.punchInLongitude = longitude ?? undefined;
    } else if (punchType === "OUT") {
      if (!attendance.punchInTime) {
        return NextResponse.json(
          {
            error:
              "No punch in record found for today for this mode. Please punch in first.",
          },
          { status: 400 }
        );
      }

      if (attendance.punchOutTime) {
        return NextResponse.json(
          { error: "Already punched out for today for this mode." },
          { status: 400 }
        );
      }

      attendance.punchOutTime = now;
      attendance.punchOutImage = imageUrl;
      attendance.punchOutLatitude = latitude ?? undefined;
      attendance.punchOutLongitude = longitude ?? undefined;
    }

    await attendance.save();

    return NextResponse.json(
      {
        message:
          punchType === "IN"
            ? "Punch In recorded successfully."
            : "Punch Out recorded successfully.",
        attendanceId: attendance._id,
        data: {
          employeeId: attendance.employeeId,
          date: attendance.date,
          mode: attendance.mode,
          punchInTime: attendance.punchInTime,
          punchOutTime: attendance.punchOutTime,
          punchInImage: attendance.punchInImage,
          punchOutImage: attendance.punchOutImage,
          punchInLatitude: attendance.punchInLatitude ?? null,
          punchInLongitude: attendance.punchInLongitude ?? null,
          punchOutLatitude: attendance.punchOutLatitude ?? null,
          punchOutLongitude: attendance.punchOutLongitude ?? null,
          distanceFromOfficeMeters:
            distanceFromOfficeMeters != null
              ? Math.round(distanceFromOfficeMeters)
              : null,
          officeLocation: OFFICE_LOCATION,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Error saving attendance:", err);

    if (err.code === 11000) {
      return NextResponse.json(
        { error: "Attendance record already exists for today for this mode." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
