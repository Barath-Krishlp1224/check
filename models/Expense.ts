import mongoose, { Schema, Document } from "mongoose";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  amount?: number;
  date?: string;
}

export interface IExpense extends Document {
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: Date;
  shop?: string;
  paid: boolean;
  weekStart: string;
  subtasks?: Subtask[];
}

const SubtaskSchema = new Schema<Subtask>({
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
  subtasks: { type: [SubtaskSchema], default: [] },
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);
