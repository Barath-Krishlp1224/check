import mongoose, { Schema, Document } from "mongoose";
import { SubExpense } from "../app/components/tl-accountant/expenses/interfaces";

export interface IExpense extends Document {
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: Date;
  shop?: string;
  paid: boolean;
  weekStart: string;
  subtasks?: SubExpense[];
}

const SubExpenseSchema = new Schema<SubExpense>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
  amount: { type: Number, required: false },
  date: { type: String, required: false },
}, { _id: false });

const ExpenseSchema = new Schema<IExpense>({
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  date: { type: String, required: true },
  shop: { type: String, default: "", trim: true },
  paid: { type: Boolean, default: false },
  weekStart: { type: String, required: true },
  subtasks: { type: [SubExpenseSchema], default: [] },
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);