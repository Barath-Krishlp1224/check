// models/Holiday.ts
import mongoose, { Document } from "mongoose";

export interface IHoliday extends Document {
  name: string;
  description?: string;
  isRecurring: boolean;
  month?: number;
  day?: number;
  dateISO?: Date;
  slackChannelKey?: string; // NEW
  createdAt: Date;
}

const HolidaySchema = new mongoose.Schema<IHoliday>({
  name: { type: String, required: true },
  description: { type: String, default: "" },
  isRecurring: { type: Boolean, default: true },
  month: { type: Number },
  day: { type: Number },
  dateISO: { type: Date },
  slackChannelKey: { type: String, default: "SLACK_WEBHOOK_URL_ACC" }, // NEW
  createdAt: { type: Date, default: () => new Date() }
});

export default mongoose.models.Holiday || mongoose.model<IHoliday>("Holiday", HolidaySchema);
