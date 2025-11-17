import mongoose, { Schema, Document, Model } from "mongoose";

export type Role = "Admin" | "Manager" | "TeamLead" | "Employee";

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
  password: string; // required, not optional
  role: Role;       // NEW: role for routing
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

    category: {
      type: String,
      trim: true,
      default: "",
      required: function (this: IEmployee) {
        return this.team === "Tech";
      },
    },

    subCategory: {
      type: String,
      trim: true,
      default: "",
      required: function (this: IEmployee) {
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

    password: { type: String, required: true },

    // NEW: role for login redirect (defaults to Employee)
    role: {
      type: String,
      enum: ["Admin", "Manager", "TeamLead", "Employee"],
      default: "Employee",
      required: true,
    },
  },
  { timestamps: true }
);

// this line is a bit unusual but if you want it:
delete (mongoose.models as any).Employee;

const Employee: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);

export default Employee;
