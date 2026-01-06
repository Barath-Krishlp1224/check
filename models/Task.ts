import { Schema, model, models } from "mongoose";

const BaseSubtaskSchema = new Schema(
  {
    id: { type: String },
    title: { type: String, required: true },
    status: { type: String, default: "Pending" },
    completion: { type: Number, default: 0, min: 0 },
    remarks: { type: String },
    startDate: { type: String },
    dueDate: { type: String },
    endDate: { type: String },
    timeSpent: { type: String },
    assigneeName: { type: String },
    date: { type: String },
    storyPoints: { type: Number, default: 0, min: 0 }, 
  },
  { _id: false }
);

// Recursive subtasks
BaseSubtaskSchema.add({
  subtasks: [BaseSubtaskSchema],
});

const SubtaskSchema = BaseSubtaskSchema;

const TaskSchema = new Schema(
  {
    // 1. CHANGED: projectId must NOT be unique so multiple tasks can belong to one project
    projectId: { type: String, required: true, unique: false },

    // 2. ADDED: taskId to store the display ID sent from frontend (e.g., TASK-01)
    taskId: { type: String, required: true },

    assigneeNames: { type: [String], required: true },

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
        "TL Accountant",
      ],
      required: false,
    },

    remarks: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    dueDate: { type: String },

    status: { type: String, default: "Backlog" },

    completion: { type: Number, default: 0, min: 0 },
    
    taskStoryPoints: { type: Number, default: 0, min: 0 },
    taskTimeSpent: { type: String }, 

    subtasks: [SubtaskSchema],

    dueReminderSent: { type: Boolean, default: false },
    overdueNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 3. IMPORTANT: If an index named 'projectId_1' exists in your DB, 
// you MUST delete it in MongoDB Atlas or Compass for this change to take effect.
const Task = models.Task || model("Task", TaskSchema);
export default Task;