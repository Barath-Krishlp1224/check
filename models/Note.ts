import mongoose, { Schema, Document, models, model } from "mongoose";

export interface INote extends Document {
  path: string;
  userName: string;
  date: string;
  content: string;
  createdAt: Date;
}

const NoteSchema = new Schema<INote>(
  {
    path: { type: String, required: true },
    userName: { type: String, required: true },
    date: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

const Note = models.Note || model<INote>("Note", NoteSchema);
export default Note;