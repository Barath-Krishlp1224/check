// models/Expense.ts
import mongoose, { Schema, model, models } from "mongoose";

export interface IExpense {
  description: string;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  createdAt?: Date;
}

const ExpenseSchema = new Schema<IExpense>({
  description: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  date: { type: String, required: true }, // keep as string for easy client formatting
  createdAt: { type: Date, default: () => new Date() },
});

// Prevent model overwrite during hot reloads in dev
const ExpenseModel = models.Expense || model<IExpense>("Expense", ExpenseSchema);
export default ExpenseModel;
