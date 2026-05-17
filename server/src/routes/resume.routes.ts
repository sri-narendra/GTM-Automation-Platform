import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadMemory } from '../middleware/upload';
import {
  uploadResume,
  listResumes,
  getResume,
  optimizeResumeHandler,
  exportResume,
  deleteResume,
} from '../controllers/resume.controller';

const router = Router();

router.use(authenticate);

router.post('/upload', uploadMemory.single('resume'), uploadResume);
router.get('/', listResumes);
router.get('/:id', getResume);
router.post('/:id/optimize', optimizeResumeHandler);
router.get('/:id/export', exportResume);
router.delete('/:id', deleteResume);

export default router;
