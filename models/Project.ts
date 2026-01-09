import mongoose, { Schema, models, model, Document } from "mongoose";

// Define the interface for the Project document
interface IProject extends Document {
  name: string;
  key: string;
  description: string;
  ownerId: string;
  assigneeIds: string[]; // NEW: Added assigneeIds field
  members: Array<{
    userId: string;
    role: "Viewer" | "Contributor" | "Admin";
    addedAt: Date;
  }>;
  visibility: "PRIVATE" | "PUBLIC";
  status: "Active" | "Archived" | "Completed";
  totalTasks: number;
  completedTasks: number;
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  createdAtFormatted: string;
  completionPercentage: number;
}

/**
 * Simplified Project Schema with only required fields:
 * 1. Project Name
 * 2. Project ID (Auto-generated key)
 * 3. Project Lead (ownerId)
 */
const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    key: {
      type: String,
      required: [true, "Project key is required"],
      uppercase: true,
      unique: true,
      trim: true,
      index: true,
      maxlength: [10, "Project key cannot exceed 10 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    ownerId: {
      type: String,
      required: [true, "Project lead is required"],
    },
    assigneeIds: { // NEW: Added assigneeIds field
      type: [String],
      default: [],
    },
    members: {
      type: [{
        userId: {
          type: String,
          required: [true, "User ID is required"],
        },
        role: {
          type: String,
          enum: ["Viewer", "Contributor", "Admin"],
          default: "Contributor" as const
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }],
      default: [],
    },
    visibility: {
      type: String,
      enum: ["PRIVATE", "PUBLIC"],
      default: "PRIVATE" as const,
    },
    // Optional metadata fields
    status: {
      type: String,
      enum: ["Active", "Archived", "Completed"],
      default: "Active" as const,
    },
    // For tracking metrics
    totalTasks: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    }
  },
  { 
    timestamps: true // Automatically creates createdAt and updatedAt fields
  }
);

// Index for faster queries
ProjectSchema.index({ ownerId: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ assigneeIds: 1 }); // NEW: Index for assigneeIds

// Virtual for formatted date
ProjectSchema.virtual('createdAtFormatted').get(function(this: IProject) {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Virtual for completion percentage
ProjectSchema.virtual('completionPercentage').get(function(this: IProject) {
  if (this.totalTasks === 0) return 0;
  return Math.round((this.completedTasks / this.totalTasks) * 100);
});

// Method to update task counts
ProjectSchema.methods.updateTaskCounts = async function(this: IProject, completedTasks: number, totalTasks: number) {
  this.completedTasks = completedTasks;
  this.totalTasks = totalTasks;
  return this.save();
};

// Static method to get project metrics
ProjectSchema.statics.getProjectMetrics = async function(projectId: string) {
  const project = await this.findById(projectId);
  
  if (!project) {
    throw new Error("Project not found");
  }

  // Import Epic model
  const Epic = (await import("@/models/Epic")).default;
  
  // Get epic counts by status and priority
  const epics = await Epic.find({ projectId });
  
  const totalEpics = epics.length;
  const completedEpics = epics.filter(epic => epic.status === "Done").length;
  
  const epicsByPriority = {
    low: epics.filter(epic => epic.priority === "Low").length,
    medium: epics.filter(epic => epic.priority === "Medium").length,
    high: epics.filter(epic => epic.priority === "High").length,
    critical: epics.filter(epic => epic.priority === "Critical").length
  };

  return {
    totalEpics,
    completedEpics,
    epicsByPriority,
    totalTasks: project.totalTasks,
    completedTasks: project.completedTasks,
    completionPercentage: project.completionPercentage
  };
};

// Ensure virtual fields are included in JSON output
ProjectSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Type-safe way to remove __v
    delete (ret as any).__v;
    return ret;
  }
});

ProjectSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Type-safe way to remove __v
    delete (ret as any).__v;
    return ret;
  }
});

// Add static methods interface
interface ProjectModel extends mongoose.Model<IProject> {
  getProjectMetrics(projectId: string): Promise<any>;
}

// Prevent Mongoose from creating multiple models during Next.js Hot Module Replacement
const Project = models.Project as ProjectModel || model<IProject, ProjectModel>("Project", ProjectSchema);

export default Project;