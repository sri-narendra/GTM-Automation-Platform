import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadMemory } from '../middleware/upload';
import { enrichLimiter } from '../middleware/rateLimiter';
import {
  createLead,
  batchCreateLeads,
  listLeads,
  getLead,
  updateLead,
  deleteLead,
  enrichLead,
  batchEnrichLeads,
  getLeadStats,
} from '../controllers/lead.controller';

const router = Router();

router.use(authenticate);

router.get('/stats', getLeadStats);
router.post('/batch', uploadMemory.single('file'), batchCreateLeads);
router.post('/batch/enrich', enrichLimiter, batchEnrichLeads);
router.get('/', listLeads);
router.post('/', createLead);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.post('/:id/enrich', enrichLimiter, enrichLead);

export default router;
