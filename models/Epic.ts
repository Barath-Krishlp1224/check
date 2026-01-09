import mongoose, { Schema, models, model, Document } from "mongoose";

// Define interfaces for employee info
interface EmployeeInfo {
  _id: string;
  name: string;
  email?: string;
}

// Define the interface for the Epic document
interface IEpic extends Document {
  epicId: string;
  name: string;
  summary: string;
  description: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  priority: "Low" | "Medium" | "High" | "Critical";
  startDate: Date;
  endDate: Date | null;
  // Store owner as object with id and name
  owner: EmployeeInfo;
  // Store assignees as array of objects with id and name
  assignees: EmployeeInfo[];
  labels: string[];
  projectId: string;
  projectName: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Virtual fields
  createdAtFormatted: string;
  updatedAtFormatted: string;
  startDateFormatted: string;
  endDateFormatted: string;
  progress: number;
}

/**
 * Epic Schema for managing large work items within projects
 */
const EpicSchema = new Schema<IEpic>(
  {
    epicId: {
      type: String,
      required: [true, "Epic ID is required"],
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Epic name is required"],
      trim: true,
      maxlength: [200, "Epic name cannot exceed 200 characters"],
    },
    summary: {
      type: String,
      required: [true, "Epic summary is required"],
      trim: true,
      maxlength: [500, "Summary cannot exceed 500 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "Review", "Done"],
      default: "Todo" as const,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium" as const,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    owner: {
      _id: {
        type: String,
        required: [true, "Owner ID is required"],
      },
      name: {
        type: String,
        required: [true, "Owner name is required"],
      },
      email: {
        type: String,
        default: "",
      }
    },
    assignees: {
      type: [{
        _id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          default: "",
        }
      }],
      default: [],
    },
    labels: {
      type: [String],
      default: [],
    },
    projectId: {
      type: String,
      required: [true, "Project ID is required"],
      index: true,
    },
    projectName: {
      type: String,
      default: "",
    },
    createdBy: {
      type: String,
      default: "system",
    },
  },
  { 
    timestamps: true
  }
);

// Indexes for faster queries
EpicSchema.index({ projectId: 1, status: 1 });
EpicSchema.index({ projectId: 1, priority: 1 });
EpicSchema.index({ "owner._id": 1 });
EpicSchema.index({ "assignees._id": 1 });
EpicSchema.index({ labels: 1 });

// Virtual for formatted dates (keep as is)
EpicSchema.virtual('createdAtFormatted').get(function(this: IEpic) {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

EpicSchema.virtual('updatedAtFormatted').get(function(this: IEpic) {
  return this.updatedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

EpicSchema.virtual('startDateFormatted').get(function(this: IEpic) {
  return this.startDate ? this.startDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'Not set';
});

EpicSchema.virtual('endDateFormatted').get(function(this: IEpic) {
  return this.endDate ? this.endDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }) : 'Not set';
});

EpicSchema.virtual('progress').get(function(this: IEpic) {
  return 0;
});

EpicSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete (ret as any).__v;
    return ret;
  }
});

EpicSchema.set('toObject', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete (ret as any).__v;
    return ret;
  }
});

const Epic = models.Epic || model<IEpic>("Epic", EpicSchema);
export default Epic;