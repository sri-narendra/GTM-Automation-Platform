import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { IResume, IExperience, IEducation, IResumeOptimization } from '../types';

export interface IResumeDocument extends Omit<IResume, '_id' | 'userId'>, Document {
  userId: Types.ObjectId;
}

const experienceSchema = new Schema<IExperience>(
  {
    title: { type: String },
    company: { type: String },
    duration: { type: String },
    description: [{ type: String }],
  },
  { _id: false }
);

const educationSchema = new Schema<IEducation>(
  {
    degree: { type: String },
    institution: { type: String },
    year: { type: String },
  },
  { _id: false }
);

const optimizationSchema = new Schema<IResumeOptimization>(
  {
    jobDescription: { type: String },
    originalBullets: [{ type: String }],
    optimizedBullets: [{ type: String }],
    atsScore: { type: Number },
    matchRate: { type: Number },
    missingKeywords: [{ type: String }],
    coverLetter: { type: String },
    recruiterEmail: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const resumeSchema = new Schema<IResumeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFilename: { type: String, required: true },
    content: { type: String, required: true },
    parsedData: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
      skills: [{ type: String }],
      experience: [experienceSchema],
      education: [educationSchema],
    },
    optimizations: [optimizationSchema],
  },
  { timestamps: true }
);

export const Resume: Model<IResumeDocument> = mongoose.model<IResumeDocument>('Resume', resumeSchema);
