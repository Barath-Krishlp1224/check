import mongoose, { Schema, Document, Model } from "mongoose";

export type Role = "Admin" | "Manager" | "TeamLead" | "Employee";

export interface IEmployee extends Document {
  empId: string;
  name: string;
  displayName?: string;

  fatherName: string;
  dateOfBirth: string;
  joiningDate: string;

  team:
    | "Founders"
    | "Manager"
    | "TL-Reporting Manager"
    | "IT Admin"
    | "Tech"
    | "Accounts"
    | "HR"
    | "Admin & Operations"
    | "Housekeeping"
    | "TL Accountant";

  category?: string;
  subCategory?: string;
  department: string;

  photo?: string;
  phoneNumber: string;
  mailId: string;

  accountNumber: string;
  ifscCode: string;

  // 🔑 MUST be optional in TS (deleted in toJSON)
  password?: string;

  employmentType: "Fresher" | "Experienced";

  aadharDoc?: string;
  panDoc?: string;
  tenthMarksheet?: string;
  twelfthMarksheet?: string;
  provisionalCertificate?: string;
  experienceCertificate?: string;

  role: Role;

  resetToken?: string | null;
  resetTokenExpiry?: Date | null;

  // 💬 Chat presence
  isOnline?: boolean;
  lastSeen?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    empId: { type: String, required: true, unique: true, trim: true },

    name: { type: String, required: true, trim: true },
    displayName: { type: String, trim: true },

    fatherName: { type: String, required: true, trim: true },
    dateOfBirth: { type: String, required: true, trim: true },
    joiningDate: { type: String, required: true, trim: true },

    team: {
      type: String,
      required: true,
      enum: [
        "Founders",
        "Manager",
        "TL-Reporting Manager",
        "IT Admin",
        "Tech",
        "Accounts",
        "HR",
        "Admin & Operations",
        "Housekeeping",
        "TL Accountant",
      ],
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

    // 🔒 NEVER exposed
    password: { type: String, required: true, select: false },

    employmentType: {
      type: String,
      enum: ["Fresher", "Experienced"],
      required: true,
    },

    aadharDoc: { type: String, default: "" },
    panDoc: { type: String, default: "" },
    tenthMarksheet: { type: String, default: "" },
    twelfthMarksheet: { type: String, default: "" },
    provisionalCertificate: { type: String, default: "" },
    experienceCertificate: { type: String, default: "" },

    role: {
      type: String,
      enum: ["Admin", "Manager", "TeamLead", "Employee"],
      default: "Employee",
      required: true,
    },

    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },

    // 💬 Chat fields
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_, ret) {
        delete ret.password; // ✅ TS-safe now
        return ret;
      },
    },
  }
);

// ✅ Prevent Next.js model overwrite
delete (mongoose.models as any).Employee;

const Employee: Model<IEmployee> =
  mongoose.models.Employee ||
  mongoose.model<IEmployee>("Employee", EmployeeSchema);

export default Employee;
