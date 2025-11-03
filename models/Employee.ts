import mongoose, { Schema, Document, Model } from "mongoose";

// --- Interface remains the same ---
export interface IEmployee extends Document {
  empId: string;
  name: string;
  fatherName: string;
  dateOfBirth: string;
  joiningDate: string;
  team: "Tech" | "Accounts" | "HR" | "Admin & Operations";
  category?: string;
  subCategory?: string;
  department: string;
  photo?: string;
  phoneNumber: string;
  mailId: string;
  accountNumber: string;
  ifscCode: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    empId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    dateOfBirth: { type: String, required: true, trim: true },
    joiningDate: { type: String, required: true, trim: true },
    team: {
      type: String,
      required: true,
      enum: ["Tech", "Accounts", "HR", "Admin & Operations"],
      trim: true,
    },

    // ✅ CATEGORY LOGIC: Required only if the team is "Tech"
    category: {
      type: String,
      trim: true,
      default: "",
      required: function (this: IEmployee) {
        // Category is required for ALL Tech roles (Developer, IT Admin, DevOps, etc.)
        return this.team === "Tech";
      },
    },

    // ✅ SUB-CATEGORY LOGIC: Required only if the team is "Tech" AND the category is "Developer"
    subCategory: {
      type: String,
      trim: true,
      default: "",
      required: function (this: IEmployee) {
        // SubCategory is only relevant/required for the Developer category under Tech
        return this.team === "Tech" && this.category === "Developer";
      },
    },

    department: { type: String, required: true, trim: true },
    photo: { type: String, default: "" },
    phoneNumber: { type: String, required: true, trim: true },
    mailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    accountNumber: { type: String, required: true, trim: true },
    ifscCode: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// ✅ Avoid redefinition during Next.js hot reload
delete mongoose.models.Employee;

const Employee: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);

export default Employee;