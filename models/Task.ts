import { Schema, model, models } from "mongoose";

const SubtaskSchema = new Schema({
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

    department: {
      type: String,
      enum: [
        "Tech",
        "Accounts",
        "IT Admin",
        "Manager",
        "Admin & Operations",
        "HR",
        "Founders",
        "TL-Reporting Manager",
      ],
      required: false,
    },

    remarks: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    dueDate: { type: String },

    status: { type: String, default: "Backlog" },
    completion: { type: Number, default: 0, min: 0, max: 100 },

    subtasks: [SubtaskSchema],

    dueReminderSent: { type: Boolean, default: false },
    overdueNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Task = models.Task || model("Task", TaskSchema);
export default Task;