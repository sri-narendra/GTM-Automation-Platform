import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Lead } from '../models/Lead';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { enrichSingleLead, enrichLeadBatch } from '../services/enrichment';
import { parseCSV } from '../utils/helpers';
import { ApiResponse, PaginatedResponse } from '../types';

const createLeadSchema = z.object({
  domain: z.string().optional(),
  linkedinUrl: z.string().optional(),
  companyName: z.string().optional(),
  companyDescription: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  location: z.string().optional(),
  founded: z.string().optional(),
  technologies: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  painPoints: z.array(z.string()).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
});

const batchCreateSchema = z.object({
  leads: z.array(createLeadSchema).min(1).max(500),
});

const updateLeadSchema = createLeadSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().default('-createdAt'),
  status: z.enum(['pending', 'enriching', 'enriched', 'failed']).optional(),
  search: z.string().optional(),
  industry: z.string().optional(),
  category: z.string().optional(),
  isHiring: z.coerce.boolean().optional(),
});

export async function createLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createLeadSchema.parse(req.body);
    const lead = await Lead.create({ ...data, userId: req.user!._id });

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Lead created successfully',
    } satisfies ApiResponse);

    logger.info({ leadId: lead._id }, 'Lead created');
  } catch (err) {
    next(err);
  }
}

export async function batchCreateLeads(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    let leadsData: any[];

    if (req.file) {
      const parsed = parseCSV(req.file.buffer);
      leadsData = parsed.map((row) => ({
        domain: row.domain || row.Domain || row.website || row.Website,
        companyName: row.company_name || row.companyName || row.Company || row.name || row.Name,
        linkedinUrl: row.linkedin_url || row.linkedinUrl || row.LinkedIn || row.linkedin,
        industry: row.industry || row.Industry,
        location: row.location || row.Location,
        email: row.email || row.Email,
        phone: row.phone || row.Phone,
      }));
    } else {
      leadsData = batchCreateSchema.parse(req.body).leads;
    }

    const leadsToInsert = leadsData.map((data) => ({
      ...data,
      userId: req.user!._id,
    }));

    const leads = await Lead.insertMany(leadsToInsert, { ordered: false });

    res.status(201).json({
      success: true,
      data: leads,
      count: leads.length,
      message: `${leads.length} leads created successfully`,
    } satisfies ApiResponse);

    logger.info({ count: leads.length }, 'Batch leads created');
  } catch (err: any) {
    next(err);
  }
}

export async function listLeads(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listQuerySchema.parse(req.query);
    const filter: Record<string, any> = { userId: req.user!._id };

    if (query.status) filter.status = query.status;
    if (query.industry) filter.industry = query.industry;
    if (query.category) filter.category = query.category;
    if (query.isHiring !== undefined) filter.isHiring = query.isHiring;

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { companyName: searchRegex },
        { domain: searchRegex },
        { industry: searchRegex },
        { location: searchRegex },
        { email: searchRegex },
      ];
    }

    const total = await Lead.countDocuments(filter);
    const totalPages = Math.ceil(total / query.limit);
    const skip = (query.page - 1) * query.limit;

    const sortObj: Record<string, 1 | -1> = {};
    if (query.sort.startsWith('-')) {
      sortObj[query.sort.slice(1)] = -1;
    } else {
      sortObj[query.sort] = 1;
    }

    const leads = await Lead.find(filter).sort(sortObj).skip(skip).limit(query.limit);

    res.json({
      success: true,
      data: leads,
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      count: leads.length,
    } as any);
  } catch (err) {
    next(err);
  }
}

export async function getLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!lead) throw new NotFoundError('Lead');

    res.json({ success: true, data: lead } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function updateLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateLeadSchema.parse(req.body);
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!lead) throw new NotFoundError('Lead');

    res.json({
      success: true,
      data: lead,
      message: 'Lead updated successfully',
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function deleteLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await Lead.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!lead) throw new NotFoundError('Lead');

    res.json({
      success: true,
      message: 'Lead deleted successfully',
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function enrichLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!lead) throw new NotFoundError('Lead');

    const result = await enrichSingleLead(lead._id.toString(), req.user!._id.toString());

    res.json({
      success: true,
      data: result,
      message: 'Lead enriched successfully',
    } satisfies ApiResponse);

    logger.info({ leadId: lead._id }, 'Lead enrichment triggered');
  } catch (err) {
    next(err);
  }
}

export async function batchEnrichLeads(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { leadIds } = z.object({ leadIds: z.array(z.string()).min(1).max(50) }).parse(req.body);

    const validLeads = await Lead.find({ _id: { $in: leadIds }, userId: req.user!._id });
    if (validLeads.length === 0) throw new NotFoundError('Leads');

    const result = await enrichLeadBatch(
      validLeads.map((l) => l._id.toString()),
      req.user!._id.toString()
    );

    res.json({
      success: true,
      data: result,
      message: `Enriched ${result.enriched} leads, ${result.failed} failed`,
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function getLeadStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const total = await Lead.countDocuments({ userId: req.user!._id });
    const byStatus = await Lead.aggregate([
      { $match: { userId: req.user!._id as any } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byIndustry = await Lead.aggregate([
      { $match: { userId: req.user!._id as any, industry: { $nin: [null, ''] } } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);
    const enriched = await Lead.countDocuments({ userId: req.user!._id, status: 'enriched' });

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) statusMap[s._id] = s.count;

    res.json({
      success: true,
      data: {
        total,
        enriched,
        pending: statusMap.pending || 0,
        enriching: statusMap.enriching || 0,
        failed: statusMap.failed || 0,
        topIndustries: byIndustry,
        enrichmentRate: total > 0 ? Math.round((enriched / total) * 100) : 0,
      },
    } as ApiResponse);
  } catch (err) {
    next(err);
  }
}
