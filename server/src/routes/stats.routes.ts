import { Response, NextFunction } from 'express';
import { Router } from 'express';
import { Lead } from '../models/Lead';
import { Workflow } from '../models/Workflow';
import { Job } from '../models/Job';
import { Resume } from '../models/Resume';
import { Outreach } from '../models/Outreach';
import { AuthRequest, authenticate } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = Router();

router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;

    const [leadCount, workflowCount, jobCount, resumeCount, outreachCount] = await Promise.all([
      Lead.countDocuments({ userId }),
      Workflow.countDocuments({ userId }),
      Job.countDocuments({ userId }),
      Resume.countDocuments({ userId }),
      Outreach.countDocuments({ userId }),
    ]);

    const leadByStatus = await Lead.aggregate([
      { $match: { userId: userId as any } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const jobByStatus = await Job.aggregate([
      { $match: { userId: userId as any } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const workflowByStatus = await Workflow.aggregate([
      { $match: { userId: userId as any } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const toMap = (arr: Array<{ _id: string; count: number }>) => {
      const map: Record<string, number> = {};
      for (const item of arr) map[item._id] = item.count;
      return map;
    };

    res.json({
      success: true,
      data: {
        leads: { total: leadCount, ...toMap(leadByStatus) },
        workflows: { total: workflowCount, ...toMap(workflowByStatus) },
        jobs: { total: jobCount, ...toMap(jobByStatus) },
        resumes: { total: resumeCount },
        outreach: { total: outreachCount },
      },
    } satisfies ApiResponse);
  } catch (err) {
    next(err);
  }
});

export default router;
