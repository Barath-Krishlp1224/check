// models/Expense.ts
import mongoose, { Schema, Document } from "mongoose";

export type Role = "founder" | "manager" | "other";

export interface SubExpense {
  id: string;
  title: string;
  done: boolean;
  amount?: number;
  date?: string;
  employeeId?: string;
  employeeName?: string;
}

export interface IExpense extends Document {
  description: string;
  amount: number;
  date: string;
  createdAt: Date;
  shop: string;
  paid: boolean;
  weekStart: string;
  subtasks: SubExpense[];
  role: Role;
  employeeId?: string;
  employeeName?: string;
}

const SubExpenseSchema = new Schema<SubExpense>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
    amount: { type: Number, required: false },
    date: { type: String, required: false },
    employeeId: { type: String, required: false },
    employeeName: { type: String, required: false, trim: true },
  },
  { _id: false }
);

const ExpenseSchema = new Schema<IExpense>(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    shop: { type: String, default: "", trim: true },
    paid: { type: Boolean, default: false },
    weekStart: { type: String, required: true },
    subtasks: { type: [SubExpenseSchema], default: [] },
    role: {
      type: String,
      enum: ["founder", "manager", "other"],
      default: "other",
    },
    employeeId: { type: String, required: false },
    employeeName: { type: String, required: false, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);
