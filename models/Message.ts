import mongoose, { Schema, models } from "mongoose";

const MessageSchema = new Schema(
  {
    roomId: { type: String, required: true },
    senderId: String,
    senderName: String,
    receiverId: String,
    content: String,
  },
  { timestamps: true }
);

export default models.Message || mongoose.model("Message", MessageSchema);
