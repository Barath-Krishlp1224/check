// models/Attendance.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export type AttendanceMode =
  | "IN_OFFICE"
  | "WORK_FROM_HOME"
  | "ON_DUTY"
  | "REGULARIZATION";

export interface IAttendance extends Document {
  employeeId: string;
  /**
   * Stored as "YYYY-MM-DD" (IST date),
   * same style used by Hikvision aggregation.
   */
  date: string;
  mode: AttendanceMode;

  punchInTime?: Date;
  punchOutTime?: Date;
  punchInImage?: string; // S3 URL
  punchOutImage?: string; // S3 URL
  punchInLatitude?: number;
  punchInLongitude?: number;
  punchOutLatitude?: number;
  punchOutLongitude?: number;

  // 🔹 New fields for Branch tracking
  punchInBranch?: string;
  punchOutBranch?: string;

  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema<IAttendance> = new Schema(
  {
    employeeId: { type: String, required: true },

    // 🔹 Important: store as string "YYYY-MM-DD"
    date: { type: String, required: true },

    mode: {
      type: String,
      enum: ["IN_OFFICE", "WORK_FROM_HOME", "ON_DUTY", "REGULARIZATION"],
      required: true,
      default: "IN_OFFICE",
    },

    // Punch In
    punchInTime: { type: Date },
    punchInImage: { type: String },
    punchInLatitude: { type: Number },
    punchInLongitude: { type: Number },
    punchInBranch: { type: String }, // 🔹 Added

    // Punch Out
    punchOutTime: { type: Date },
    punchOutImage: { type: String },
    punchOutLatitude: { type: Number },
    punchOutLongitude: { type: Number },
    punchOutBranch: { type: String }, // 🔹 Added
  },
  { timestamps: true }
);

// 🔹 Ensure unique (employeeId + date + mode) combination
AttendanceSchema.index({ employeeId: 1, date: 1, mode: 1 }, { unique: true });

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;