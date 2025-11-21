// models/SentNotification.ts
import mongoose, { Document } from "mongoose";

export interface ISentNotification extends Document {
  holidayId: mongoose.Types.ObjectId;
  type: "7_days" | "2_days" | "on_day";
  year: number;
  sentAt: Date;
}

const SentNotificationSchema = new mongoose.Schema<ISentNotification>({
  holidayId: { type: mongoose.Schema.Types.ObjectId, ref: "Holiday", required: true },
  type: { type: String, enum: ["7_days", "2_days", "on_day"], required: true },
  year: { type: Number, required: true },
  sentAt: { type: Date, default: () => new Date() }
});

SentNotificationSchema.index({ holidayId: 1, type: 1, year: 1 }, { unique: true });

export default mongoose.models.SentNotification ||
  mongoose.model<ISentNotification>("SentNotification", SentNotificationSchema);
