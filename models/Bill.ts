import mongoose, { Document, Model, Schema } from "mongoose";

export interface IBill extends Document {
  name: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  dateAdded: string;
  paidDate?: string | null;
}

const BillSchema = new Schema<IBill>(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: String, required: true },
    paid: { type: Boolean, default: false },
    dateAdded: { type: String, required: true },
    paidDate: { type: String, default: null }, 
  },
  { timestamps: true }
);

const Bill: Model<IBill> = (mongoose.models.Bill as Model<IBill>) || mongoose.model<IBill>("Bill", BillSchema);

export default Bill;