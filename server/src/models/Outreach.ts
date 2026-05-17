import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IOutreach } from '../types';

export interface IOutreachDocument extends Omit<IOutreach, '_id' | 'userId' | 'leadId'>, Document {
  userId: Types.ObjectId;
  leadId?: Types.ObjectId;
}

const outreachSchema = new Schema<IOutreachDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
    },
    type: {
      type: String,
      enum: ['cold_email', 'linkedin', 'follow_up'],
      required: true,
    },
    leadInfo: {
      companyName: { type: String },
      contactName: { type: String },
      role: { type: String },
      industry: { type: String },
    },
    content: { type: String, required: true },
    subject: { type: String },
    tone: {
      type: String,
      enum: ['professional', 'friendly', 'formal'],
      default: 'professional',
    },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Outreach: Model<IOutreachDocument> = mongoose.model<IOutreachDocument>('Outreach', outreachSchema);
