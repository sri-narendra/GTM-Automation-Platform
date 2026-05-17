import { cleanupOldJobs, retryFailedJobs } from '../services/jobQueue';
import { Workflow } from '../models/Workflow';
import { logger } from '../utils/logger';

export async function runCleanup(): Promise<void> {
  try {
    logger.info('Starting scheduled cleanup');

    const deletedJobs = await cleanupOldJobs(30);
    const requeuedJobs = await retryFailedJobs();

    const archivedWorkflows = await Workflow.updateMany(
      { status: 'archived', updatedAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
      { status: 'archived' }
    );

    logger.info({
      deletedJobs,
      requeuedJobs,
      archivedWorkflows: archivedWorkflows.modifiedCount,
    }, 'Scheduled cleanup completed');
  } catch (err: any) {
    logger.error({ err }, 'Scheduled cleanup failed');
  }
}

export async function runRetryFailed(): Promise<void> {
  try {
    const requeued = await retryFailedJobs();
    if (requeued > 0) {
      logger.info({ requeued }, 'Retry cycle completed');
    }
  } catch (err: any) {
    logger.error({ err }, 'Retry cycle failed');
  }
}
