import mongoose, { Schema, Document, Model } from "mongoose";

export type Role = "Admin" | "Manager" | "TeamLead" | "Employee";

export interface IEmployee extends Document {
  empId: string;
  name: string;
  displayName?: string;
  fatherName: string;
  dateOfBirth: string;
  joiningDate: string;
  team: string;
  category?: string;
  subCategory?: string;
  department: string;
  photo?: string;
  phoneNumber: string;
  mailId: string;
  accountNumber: string;
  ifscCode: string;
  password?: string;
  employmentType: "Fresher" | "Experienced";
  role: Role;
  
  // Salary Structure Fields
  salary: number; // This represents Gross/Total Earnings
  basic: number;
  hra: number;
  bonus: number;
  specialAllowance: number;
  
  // Deduction Fields
  incomeTax: number;
  pf: number;
  healthInsurance: number;
  professionalTax: number;

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
    team: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: "" },
    subCategory: { type: String, trim: true, default: "" },
    department: { type: String, required: true, trim: true },
    photo: { type: String, default: "" },
    phoneNumber: { type: String, required: true, trim: true },
    mailId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    ifscCode: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
    employmentType: { type: String, enum: ["Fresher", "Experienced"], required: true },
    role: { type: String, enum: ["Admin", "Manager", "TeamLead", "Employee"], default: "Employee" },
    
    // Salary Breakdown (Earnings)
    salary: { type: Number, default: 0 }, // Gross
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    
    // Deductions
    incomeTax: { type: Number, default: 0 },
    pf: { type: Number, default: 0 },
    healthInsurance: { type: Number, default: 500 }, // Requested default
    professionalTax: { type: Number, default: 200 }, // Requested default
  },
  { timestamps: true }
);

const Employee: Model<IEmployee> =
  mongoose.models.Employee || mongoose.model<IEmployee>("Employee", EmployeeSchema);

export default Employee;