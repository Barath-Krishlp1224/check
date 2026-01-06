import mongoose, { Schema, models, model } from "mongoose";

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
      type: [String], // Array of employee IDs from the "team" step
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
      default: ["Epic", "Story", "Task", "Bug"],
    }
  },
  { timestamps: true }
);

export default models.Project || model("Project", ProjectSchema);