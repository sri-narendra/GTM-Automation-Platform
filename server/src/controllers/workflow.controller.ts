import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Workflow } from '../models/Workflow';
import { Job } from '../models/Job';
import { AuthRequest } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { addJob } from '../services/jobQueue';
import { ApiResponse } from '../types';

const stepSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['enrich_lead', 'scrape_website', 'summarize_ai', 'generate_outreach', 'optimize_resume', 'send_webhook', 'classify_lead', 'score_lead', 'filter', 'delay']),
  name: z.string().min(1),
  config: z.record(z.any()).default({}),
  position: z.number().int().min(0),
});

const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(200),
  description: z.string().optional(),
  trigger: z.object({
    type: z.enum(['csv_upload', 'cron', 'webhook', 'manual']),
    config: z.record(z.any()).default({}),
  }).default({ type: 'manual', config: {} }),
  steps: z.array(stepSchema).default([]),
  status: z.enum(['active', 'paused', 'draft', 'archived']).optional(),
});

const updateWorkflowSchema = createWorkflowSchema.partial();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['active', 'paused', 'draft', 'archived']).optional(),
  search: z.string().optional(),
});

export async function createWorkflow(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createWorkflowSchema.parse(req.body);

    const steps = data.steps.map((s, i) => ({
      id: s.id || uuidv4(),
      type: s.type,
      name: s.name,
      config: s.config,
      position: s.position ?? i,
    }));

    const workflow = await Workflow.create({
      ...data,
      steps,
      userId: req.user!._id,
    });

    res.status(201).json({
      success: true,
      data: workflow,
      message: 'Workflow created successfully',
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function listWorkflows(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listQuerySchema.parse(req.query);
    const filter: Record<string, any> = { userId: req.user!._id };

    if (query.status) filter.status = query.status;
    if (query.search) {
      filter.name = new RegExp(query.search, 'i');
    }

    const total = await Workflow.countDocuments(filter);
    const skip = (query.page - 1) * query.limit;

    const workflows = await Workflow.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(query.limit);

    res.json({
      success: true,
      data: workflows,
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
      count: workflows.length,
    } as any);
  } catch (err) {
    next(err);
  }
}

export async function getWorkflow(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!workflow) throw new NotFoundError('Workflow');

    res.json({ success: true, data: workflow } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function updateWorkflow(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateWorkflowSchema.parse(req.body);

    const update: Record<string, any> = {};
    if (data.name) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.trigger) update.trigger = data.trigger;
    if (data.steps) {
      update.steps = data.steps.map((s, i) => ({
        id: s.id || uuidv4(),
        type: s.type,
        name: s.name,
        config: s.config,
        position: s.position ?? i,
      }));
    }
    if (data.status) update.status = data.status;

    const workflow = await Workflow.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!workflow) throw new NotFoundError('Workflow');

    res.json({
      success: true,
      data: workflow,
      message: 'Workflow updated successfully',
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkflow(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const workflow = await Workflow.findOneAndDelete({ _id: req.params.id, userId: req.user!._id });
    if (!workflow) throw new NotFoundError('Workflow');

    res.json({
      success: true,
      message: 'Workflow deleted successfully',
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function executeWorkflow(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!workflow) throw new NotFoundError('Workflow');

    if (workflow.steps.length === 0) {
      throw new ValidationError('Workflow has no steps to execute');
    }

    const job = await addJob({
      userId: req.user!._id.toString(),
      workflowId: workflow._id.toString(),
      type: 'workflow',
      payload: { workflowId: workflow._id.toString(), steps: workflow.steps },
    });

    await Workflow.updateOne({ _id: workflow._id }, { lastRun: new Date(), $inc: { runCount: 1 } });

    res.json({
      success: true,
      data: { job },
      message: 'Workflow execution started',
    } satisfies ApiResponse);

    logger.info({ workflowId: workflow._id, jobId: job._id }, 'Workflow execution triggered');
  } catch (err) {
    next(err);
  }
}

export async function toggleWorkflow(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const workflow = await Workflow.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!workflow) throw new NotFoundError('Workflow');

    const newStatus = workflow.status === 'active' ? 'paused' : 'active';
    workflow.status = newStatus;
    await workflow.save();

    res.json({
      success: true,
      data: workflow,
      message: `Workflow ${newStatus === 'active' ? 'activated' : 'paused'} successfully`,
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}

export async function duplicateWorkflow(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const original = await Workflow.findOne({ _id: req.params.id, userId: req.user!._id });
    if (!original) throw new NotFoundError('Workflow');

    const duplicate = await Workflow.create({
      userId: req.user!._id,
      name: `${original.name} (Copy)`,
      description: original.description,
      trigger: original.trigger,
      steps: original.steps.map((s) => ({ ...s, id: uuidv4() })),
      status: 'draft',
    });

    res.status(201).json({
      success: true,
      data: duplicate,
      message: 'Workflow duplicated successfully',
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
}
