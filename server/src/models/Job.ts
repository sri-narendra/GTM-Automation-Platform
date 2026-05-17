import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IJob } from '../types';

export interface IJobDocument extends Omit<IJob, '_id' | 'userId' | 'workflowId'>, Document {
  userId: Types.ObjectId;
  workflowId?: Types.ObjectId;
}

const jobSchema = new Schema<IJobDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workflowId: {
      type: Schema.Types.ObjectId,
      ref: 'Workflow',
    },
    type: {
      type: String,
      enum: [
        'enrichment',
        'scraping',
        'ai_research',
        'outreach',
        'resume_optimization',
        'workflow',
        'bulk_enrich',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'retrying'],
      default: 'pending',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    payload: { type: Schema.Types.Mixed, default: {} },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    retries: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

jobSchema.index({ status: 1, type: 1 });
jobSchema.index({ createdAt: 1 });

export const Job: Model<IJobDocument> = mongoose.model<IJobDocument>('Job', jobSchema);
