import mongoose, { Schema, model, models } from "mongoose";

const StaffPayrollSchema = new Schema(
  {
    empId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    displayName: { type: String },
    department: { type: String },
    role: { type: String },
    salary: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "employees",
  }
);

const StaffPayroll =
  models.StaffPayroll || model("StaffPayroll", StaffPayrollSchema);

export default StaffPayroll;
