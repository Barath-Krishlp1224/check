import mongoose, { Schema, Document } from "mongoose";

export interface IInitialAmountHistoryEntry extends Document {
  amount: number;
  date: string; // ISO date string
}

const InitialAmountHistoryEntrySchema = new Schema<IInitialAmountHistoryEntry>(
  {
    amount: { type: Number, required: true },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.InitialAmountHistory ||
  mongoose.model<IInitialAmountHistoryEntry>("InitialAmountHistory", InitialAmountHistoryEntrySchema);