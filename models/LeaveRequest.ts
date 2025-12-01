import mongoose, { Schema, Document, Model } from "mongoose";

export type LeaveType = "sick" | "casual" | "planned" | "unplanned";
export type LeaveStatus = "pending" | "approved" | "rejected" | "auto-approved";

export interface ILeaveRequest extends Document {
  employeeName?: string;
  employeeId?: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  description?: string;
  status: LeaveStatus;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>(
  {
    employeeName: { type: String },
    employeeId: { type: String },
    leaveType: {
      type: String,
      enum: ["sick", "casual", "planned", "unplanned"],
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    days: { type: Number, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "auto-approved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const LeaveRequest: Model<ILeaveRequest> =
  mongoose.models.LeaveRequest ||
  mongoose.model<ILeaveRequest>("LeaveRequest", LeaveRequestSchema);

export default LeaveRequest;
