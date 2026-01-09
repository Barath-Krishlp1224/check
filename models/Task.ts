import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  taskId: string;
  issueKey: string;
  summary: string;
  description?: string;
  issueType: 'Story' | 'Task' | 'Bug';
  status: 'Todo' | 'In Progress' | 'Review' | 'Done' | 'Blocked';
  priority: 'Lowest' | 'Low' | 'Medium' | 'High' | 'Highest';
  assigneeIds: string[];  // Changed from assigneeId to assigneeIds (array)
  reporterIds: string[];  // Changed from reporterId to reporterIds (array)
  assigneeNames?: string[]; // Add this to store names
  reporterNames?: string[]; // Add this to store names
  epicId?: string;
  epicName?: string;
  storyPoints?: number;
  labels: string[];
  dueDate?: Date;
  duration?: number;
  attachments: string[];
  comments: any[];
  projectId: string;
  project?: string;
  projectName?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
  taskId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  issueKey: {
    type: String,
    trim: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  issueType: {
    type: String,
    enum: ['Story', 'Task', 'Bug'],
    default: 'Story'
  },
  status: {
    type: String,
    enum: ['Todo', 'In Progress', 'Review', 'Done', 'Blocked'],
    default: 'Todo'
  },
  priority: {
    type: String,
    enum: ['Lowest', 'Low', 'Medium', 'High', 'Highest'],
    default: 'Medium'
  },
  assigneeIds: {  // Changed to array
    type: [String],
    default: []
  },
  reporterIds: {  // Changed to array
    type: [String],
    default: []
  },
  assigneeNames: { // New field to store names
    type: [String],
    default: []
  },
  reporterNames: { // New field to store names
    type: [String],
    default: []
  },
  epicId: {
    type: String,
    trim: true
  },
  epicName: {
    type: String,
    trim: true
  },
  storyPoints: {
    type: Number,
    default: 0
  },
  labels: {
    type: [String],
    default: []
  },
  dueDate: {
    type: Date
  },
  duration: {
    type: Number,
    default: 0
  },
  attachments: {
    type: [String],
    default: []
  },
  comments: {
    type: [{
      userId: String,
      userName: String,
      content: String,
      createdAt: Date
    }],
    default: []
  },
  projectId: {
    type: String,
    required: false,
    trim: true
  },
  project: {
    type: String,
    required: false,
    trim: true
  },
  projectName: {
    type: String,
    trim: true
  },
  createdBy: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add index for better query performance
TaskSchema.index({ epicId: 1 });
TaskSchema.index({ projectId: 1 });
TaskSchema.index({ assigneeIds: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ createdAt: -1 });

export default mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);