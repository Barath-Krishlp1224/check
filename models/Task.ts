import mongoose, { Schema, model, models } from "mongoose";

/**
 * Recursive Subtask Schema
 * Supports infinite nesting of subtasks as defined in the frontend.
 */
const BaseSubtaskSchema = new Schema(
  {
    id: { type: String },
    title: { type: String, required: true },
    status: { type: String, default: "To Do" },
    completion: { type: Number, default: 0, min: 0, max: 100 },
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

// Enable recursive nesting for subtasks
BaseSubtaskSchema.add({
  subtasks: [BaseSubtaskSchema],
});

/**
 * Main Task Schema
 * Stores Epics, Stories, Tasks, and Bugs.
 */
const TaskSchema = new Schema(
  {
    // ID of the Project this task belongs to (Allows multiple tasks per project)
    projectId: { 
      type: String, 
      required: true, 
      unique: false,
      index: true 
    },

    // Human-readable ID (e.g., PROJ-101)
    taskId: { type: String, required: true },

    // Project Name for display purposes
    project: { type: String, required: true },

    // Core Task Data
    assigneeNames: { type: [String], required: true },
    department: {
      type: String,
      enum: [
        "Tech", "Accounts", "IT Admin", "Manager", "Admin & Operations",
        "HR", "Founders", "TL-Reporting Manager", "TL Accountant",
      ],
      required: false,
    },

    // Jira Specific Fields
    issueType: { 
      type: String, 
      enum: ["Epic", "Story", "Task", "Bug", "Subtask"],
      default: "Task" 
    },
    priority: { 
      type: String, 
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium" 
    },
    backlogOrder: { type: Number, default: 0 }, // For manual drag-and-drop ordering
    epicLink: { type: String, default: "" },    // To link Stories/Tasks to an Epic

    // Details & Progress
    remarks: { type: String },
    startDate: { type: String },
    endDate: { type: String },
    dueDate: { type: String },
    status: { type: String, default: "Backlog" },
    completion: { type: Number, default: 0, min: 0, max: 100 },
    
    // Metrics
    taskStoryPoints: { type: Number, default: 0, min: 0 },
    taskTimeSpent: { type: String }, 

    // Hierarchical Data
    subtasks: [BaseSubtaskSchema],

    // Notification states
    dueReminderSent: { type: Boolean, default: false },
    overdueNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure the model is only compiled once in Next.js development mode
const Task = models.Task || model("Task", TaskSchema);

export default Task;