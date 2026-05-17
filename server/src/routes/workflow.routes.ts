import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  toggleWorkflow,
  duplicateWorkflow,
} from '../controllers/workflow.controller';

const router = Router();

router.use(authenticate);

router.get('/', listWorkflows);
router.post('/', createWorkflow);
router.get('/:id', getWorkflow);
router.put('/:id', updateWorkflow);
router.delete('/:id', deleteWorkflow);
router.post('/:id/execute', executeWorkflow);
router.post('/:id/toggle', toggleWorkflow);
router.post('/:id/duplicate', duplicateWorkflow);

export default router;
