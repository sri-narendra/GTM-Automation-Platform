import { Router } from 'express';
import authRoutes from './auth.routes';
import leadRoutes from './lead.routes';
import workflowRoutes from './workflow.routes';
import jobRoutes from './job.routes';
import outreachRoutes from './outreach.routes';
import resumeRoutes from './resume.routes';
import statsRoutes from './stats.routes';
import healthRoutes from './health.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/leads', leadRoutes);
router.use('/workflows', workflowRoutes);
router.use('/jobs', jobRoutes);
router.use('/outreach', outreachRoutes);
router.use('/resumes', resumeRoutes);
router.use('/stats', statsRoutes);
router.use('/health', healthRoutes);

export default router;
