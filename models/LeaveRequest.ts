import mongoose, { Schema, Document, Model } from "mongoose";

export type LeaveType = "sick" | "casual" | "planned" | "unplanned";

export type LeaveStatus =
  | "pending"
  | "manager-pending"
  | "approved"
  | "rejected"
  | "auto-approved";

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

  teamLeadApproved?: boolean;
  managerApproved?: boolean;
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
      enum: ["pending", "manager-pending", "approved", "rejected", "auto-approved"],
      default: "pending",
    },
    teamLeadApproved: {
      type: Boolean,
      default: false,
    },
    managerApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const LeaveRequest: Model<ILeaveRequest> =
  mongoose.models.LeaveRequest ||
  mongoose.model<ILeaveRequest>("LeaveRequest", LeaveRequestSchema);

export default LeaveRequest;