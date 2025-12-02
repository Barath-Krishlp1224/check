// models/Attendance.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAttendance extends Document {
  employeeId: string;
  date: Date; // only date part matters (no time)
  punchInTime?: Date;
  punchOutTime?: Date;
  punchInImage?: string;        // S3 URL
  punchOutImage?: string;       // S3 URL
  punchInLatitude?: number;
  punchInLongitude?: number;
  punchOutLatitude?: number;
  punchOutLongitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema<IAttendance> = new Schema(
  {
    employeeId: { type: String, required: true },
    date: { type: Date, required: true }, // one doc per employee per day

    // Punch In
    punchInTime: { type: Date },
    punchInImage: { type: String },
    punchInLatitude: { type: Number },
    punchInLongitude: { type: Number },

    // Punch Out
    punchOutTime: { type: Date },
    punchOutImage: { type: String },
    punchOutLatitude: { type: Number },
    punchOutLongitude: { type: Number },
  },
  { timestamps: true }
);

// 🔹 Ensure unique (employeeId + date) combination
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;
