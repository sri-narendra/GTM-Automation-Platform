import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { Job } from '../models/Job';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { addJob, cleanupOldJobs } from '../services/jobQueue';
import { ApiResponse, PaginatedResponse } from '../types';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'retrying']).optional(),
  type: z.enum(['enrichment', 'scraping', 'ai_research', 'outreach', 'resume_optimization', 'workflow', 'bulk_enrich']).optional(),
});

export async function listJobs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listQuerySchema.parse(req.query);
    const filter: Record<string, any> = { userId: req.user!._id };

    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;

    const total = await Job.countDocuments(filter);
    const skip = (query.page - 1) * query.limit;

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .populate('workflowId', 'name');

    res.json({
      success: true,
      data: jobs,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      count: jobs.length,
    } as any);
  } catch (err) {
    next(err);
  }
}

export async function getJob(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.user!._id }).populate('workflowId', 'name steps');
    if (!job) throw new NotFoundError('Job');

    res.json({ success: true, data: job } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function retryJob(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!job) throw new NotFoundError('Job');

    if (job.status !== 'failed' && job.status !== 'retrying') {
      res.status(400).json({
        success: false,
        error: 'Only failed jobs can be retried',
      } satisfies ApiResponse);
      return;
    }

    await Job.updateOne({ _id: job._id }, { status: 'pending', error: undefined });

    res.json({
      success: true,
      message: 'Job queued for retry',
    } satisfies ApiResponse);

    logger.info({ jobId: job._id }, 'Job retry triggered');
  } catch (err) {
    next(err);
  }
}

export async function cancelJob(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const job = await Job.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!job) throw new NotFoundError('Job');

    if (job.status === 'completed' || job.status === 'failed') {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel a completed or failed job',
      } satisfies ApiResponse);
      return;
    }

    await Job.updateOne(
      { _id: job._id },
      { status: 'failed', error: 'Cancelled by user', completedAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Job cancelled successfully',
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function cleanupJobs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { days } = z.object({ days: z.coerce.number().int().min(1).default(30) }).parse(req.query);

    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await Job.deleteMany({
      userId: req.user!._id,
      status: 'completed',
      completedAt: { $lt: cutoff },
    });

    res.json({
      success: true,
      data: { deletedCount: result.deletedCount },
      message: `Cleaned up ${result.deletedCount} old jobs`,
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function getJobStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter = { userId: req.user!._id };
    const total = await Job.countDocuments(filter);
    const byStatus = await Job.aggregate([
      { $match: { userId: req.user!._id as any } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byType = await Job.aggregate([
      { $match: { userId: req.user!._id as any } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) statusMap[s._id] = s.count;
    const typeMap: Record<string, number> = {};
    for (const t of byType) typeMap[t._id] = t.count;

    res.json({
      success: true,
      data: {
        total,
        pending: statusMap.pending || 0,
        running: statusMap.running || 0,
        completed: statusMap.completed || 0,
        failed: statusMap.failed || 0,
        retrying: statusMap.retrying || 0,
        byType: typeMap,
      },
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}
