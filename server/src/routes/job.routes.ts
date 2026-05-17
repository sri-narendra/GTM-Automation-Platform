import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  listJobs,
  getJob,
  retryJob,
  cancelJob,
  cleanupJobs,
  getJobStats,
} from '../controllers/job.controller';

const router = Router();

router.use(authenticate);

router.get('/stats', getJobStats);
router.get('/', listJobs);
router.get('/:id', getJob);
router.post('/:id/retry', retryJob);
router.post('/:id/cancel', cancelJob);
router.delete('/', cleanupJobs);

export default router;
