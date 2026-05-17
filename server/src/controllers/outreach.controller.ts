import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Outreach } from '../models/Outreach';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { generateSingleOutreach, generateBatchOutreach } from '../services/outreach';
import { ApiResponse } from '../types';

const generateSchema = z.object({
  leadId: z.string().optional(),
  type: z.enum(['cold_email', 'linkedin', 'follow_up']),
  leadInfo: z.object({
    companyName: z.string().min(1),
    contactName: z.string().optional(),
    role: z.string().optional(),
    industry: z.string().optional(),
  }),
  tone: z.enum(['professional', 'friendly', 'formal']).default('professional'),
});

const batchGenerateSchema = z.object({
  leads: z.array(z.object({
    leadId: z.string().optional(),
    companyName: z.string().min(1),
    contactName: z.string().optional(),
    role: z.string().optional(),
    industry: z.string().optional(),
  })).min(1).max(50),
  type: z.enum(['cold_email', 'linkedin', 'follow_up']),
  tone: z.enum(['professional', 'friendly', 'formal']).default('professional'),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(['cold_email', 'linkedin', 'follow_up']).optional(),
});

export async function generate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = generateSchema.parse(req.body);

    const outreach = await generateSingleOutreach({
      userId: req.user!._id.toString(),
      leadId: data.leadId,
      type: data.type,
      leadInfo: data.leadInfo,
      tone: data.tone,
    });

    res.status(201).json({
      success: true,
      data: outreach,
      message: 'Outreach message generated successfully',
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function batchGenerate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = batchGenerateSchema.parse(req.body);

    const results = await generateBatchOutreach({
      userId: req.user!._id.toString(),
      leads: data.leads,
      type: data.type,
      tone: data.tone,
    });

    res.status(201).json({
      success: true,
      data: results,
      count: results.length,
      message: `Generated ${results.length} outreach messages`,
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function listOutreach(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listQuerySchema.parse(req.query);
    const filter: Record<string, any> = { userId: req.user!._id };

    if (query.type) filter.type = query.type;

    const total = await Outreach.countDocuments(filter);
    const skip = (query.page - 1) * query.limit;

    const messages = await Outreach.find(filter)
      .populate('leadId', 'companyName domain industry')
      .sort({ generatedAt: -1 })
      .skip(skip)
      .limit(query.limit);

    res.json({
      success: true,
      data: messages,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      count: messages.length,
    } as any);
  } catch (err) {
    next(err);
  }
}

export async function getOutreach(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const outreach = await Outreach.findOne({ _id: req.params.id, userId: req.user!._id }).populate('leadId');
    if (!outreach) throw new NotFoundError('Outreach message');

    res.json({ success: true, data: outreach } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function deleteOutreach(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const outreach = await Outreach.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!outreach) throw new NotFoundError('Outreach message');

    res.json({
      success: true,
      message: 'Outreach message deleted successfully',
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}
