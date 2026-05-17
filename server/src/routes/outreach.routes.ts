import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { outreachLimiter } from '../middleware/rateLimiter';
import {
  generate,
  batchGenerate,
  listOutreach,
  getOutreach,
  deleteOutreach,
} from '../controllers/outreach.controller';

const router = Router();

router.use(authenticate);

router.post('/batch', outreachLimiter, batchGenerate);
router.get('/', listOutreach);
router.post('/', outreachLimiter, generate);
router.get('/:id', getOutreach);
router.delete('/:id', deleteOutreach);

export default router;
