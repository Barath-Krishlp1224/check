import mongoose, { Schema, models, model } from "mongoose";

/**
 * Project Schema for Jira-like Management System
 * Tracks workspace configuration, team members, and framework types.
 */
const ProjectSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    key: {
      type: String,
      required: [true, "Project key is required"],
      uppercase: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    ownerId: {
      type: String,
      required: true,
      default: "user_001",
    },
    members: {
      type: [String], // Array of employee IDs/Names from the project builder
      default: [],
    },
    visibility: {
      type: String,
      enum: ["PRIVATE", "PUBLIC"],
      default: "PRIVATE",
    },
    projectType: {
      type: String,
      enum: ["Scrum", "Kanban", "Simple"],
      default: "Scrum",
    },
    issueTypes: {
      type: [String],
      default: ["Epic", "Story", "Task", "Bug", "Subtask"],
    }
  },
  { 
    timestamps: true // Automatically creates createdAt and updatedAt fields
  }
);

// Prevent Mongoose from creating multiple models during Next.js Hot Module Replacement
const Project = models.Project || model("Project", ProjectSchema);

export default Project;