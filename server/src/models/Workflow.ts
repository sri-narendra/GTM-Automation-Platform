import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IWorkflow, IWorkflowStep } from '../types';

export interface IWorkflowDocument extends Omit<IWorkflow, '_id' | 'userId'>, Document {
  userId: Types.ObjectId;
}

const workflowStepSchema = new Schema<IWorkflowStep>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'enrich_lead',
        'scrape_website',
        'summarize_ai',
        'generate_outreach',
        'optimize_resume',
        'send_webhook',
        'classify_lead',
        'score_lead',
        'filter',
        'delay',
      ],
      required: true,
    },
    name: { type: String, required: true },
    config: { type: Schema.Types.Mixed, default: {} },
    position: { type: Number, required: true },
  },
  { _id: false }
);

const workflowSchema = new Schema<IWorkflowDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
    },
    description: { type: String, trim: true },
    trigger: {
      type: {
        type: String,
        enum: ['csv_upload', 'cron', 'webhook', 'manual'],
        default: 'manual',
      },
      config: { type: Schema.Types.Mixed, default: {} },
    },
    steps: [workflowStepSchema],
    status: {
      type: String,
      enum: ['active', 'paused', 'draft', 'archived'],
      default: 'draft',
    },
    lastRun: { type: Date },
    runCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Workflow: Model<IWorkflowDocument> = mongoose.model<IWorkflowDocument>('Workflow', workflowSchema);
