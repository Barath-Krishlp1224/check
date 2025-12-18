import mongoose, { Schema, model, models } from 'mongoose';

const BehaviorMetricSchema = new Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  metrics: {
    featuresDelivered: Number,
    bugsReported: Number,
    bugRate: Number,
    storyPointsCommitted: Number,
    storyPointsCompleted: Number,
    sprintCompletionRate: Number,
    estimatedHours: Number,
    actualHours: Number,
    estimationAccuracy: Number,
    prsOpened: Number,
    prsReopened: Number,
    codeQualityScore: Number,
    leavesTaken: Number,
    behaviorScore: Number, // The 0-100 score passed to the table
  },
  createdAt: { type: Date, default: Date.now }
});

export const BehaviorMetric = models.BehaviorMetric || model('BehaviorMetric', BehaviorMetricSchema);