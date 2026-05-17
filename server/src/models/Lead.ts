import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { ILead } from '../types';

export interface ILeadDocument extends Omit<ILead, '_id' | 'userId'>, Document {
  userId: Types.ObjectId;
}

const leadSchema = new Schema<ILeadDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    domain: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    companyName: { type: String, trim: true },
    companyDescription: { type: String, trim: true },
    industry: { type: String, trim: true },
    size: { type: String, trim: true },
    location: { type: String, trim: true },
    founded: { type: String, trim: true },
    technologies: [{ type: String }],
    targetAudience: { type: String },
    painPoints: [{ type: String }],
    category: { type: String },
    summary: { type: String },
    hiringPage: { type: String },
    isHiring: { type: Boolean, default: false },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    socialLinks: [{ type: String }],
    enrichedAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'enriching', 'enriched', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

leadSchema.index({ userId: 1, domain: 1 });

export const Lead: Model<ILeadDocument> = mongoose.model<ILeadDocument>('Lead', leadSchema);
