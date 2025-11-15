// models/Task.ts
import mongoose, { Schema, model, models } from "mongoose";

const SubtaskSchema = new Schema({
  // 🆕 Added 'id' field
  id: { type: String }, 
  title: { type: String, required: true },
  status: { type: String, default: "Pending" },
  completion: { type: Number, default: 0 },
  remarks: { type: String },
  startDate: { type: String },
  dueDate: { type: String },
  endDate: { type: String },
  timeSpent: { type: String },
  assigneeName: { type: String }, 
});

const TaskSchema = new Schema(
  {
    projectId: { type: String, required: true, unique: true },
    assigneeName: { type: String, required: true },
    project: { type: String, required: true },
    remarks: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    dueDate: { type: String },
    status: { type: String, default: "In Progress" },
    completion: { type: Number, default: 0, min: 0, max: 100 },
    subtasks: [SubtaskSchema],
  },
  { timestamps: true }
);

const Task = models.Task || model("Task", TaskSchema);
export default Task;