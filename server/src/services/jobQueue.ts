import { Job, IJobDocument } from '../models/Job';
import { config } from '../config';
import { logger } from '../utils/logger';
import { sleep } from '../utils/helpers';

export async function addJob(jobData: {
  userId: string;
  workflowId?: string;
  type: IJobDocument['type'];
  payload: Record<string, any>;
  maxRetries?: number;
}): Promise<IJobDocument> {
  const job = await Job.create({
    userId: jobData.userId,
    workflowId: jobData.workflowId,
    type: jobData.type,
    status: 'pending',
    payload: jobData.payload,
    progress: 0,
    retries: 0,
    maxRetries: jobData.maxRetries || config.jobs.maxRetries,
  });

  logger.info({ jobId: job._id, type: jobData.type }, 'Job added to queue');
  return job;
}

export function processJobs(
  type: string,
  handler: (job: IJobDocument) => Promise<void>,
  options: { pollIntervalMs?: number; batchSize?: number } = {}
): () => void {
  const pollInterval = options.pollIntervalMs || 3000;
  const batchSize = options.batchSize || 5;
  let running = true;

  async function poll(): Promise<void> {
    while (running) {
      try {
        const jobs = await Job.find({ type, status: 'pending' })
          .sort({ createdAt: 1 })
          .limit(batchSize);

        if (jobs.length === 0) {
          await sleep(pollInterval);
          continue;
        }

        const processPromises = jobs.map(async (job) => {
          try {
            await Job.updateOne({ _id: job._id }, { status: 'running', startedAt: new Date() });
            logger.info({ jobId: job._id, type }, 'Job started processing');

            await handler(job);

            await Job.updateOne(
              { _id: job._id },
              { status: 'completed', progress: 100, completedAt: new Date() }
            );
            logger.info({ jobId: job._id, type }, 'Job completed');
          } catch (err: any) {
            logger.error({ err, jobId: job._id }, 'Job processing failed');

            const currentJob = await Job.findById(job._id);
            const currentRetries = (currentJob?.retries || 0) + 1;
            const maxRetries = currentJob?.maxRetries || config.jobs.maxRetries;

            if (currentRetries >= maxRetries) {
              await Job.updateOne(
                { _id: job._id },
                { status: 'failed', error: err.message, retries: currentRetries }
              );
              logger.error({ jobId: job._id, retries: currentRetries }, 'Job failed permanently');
            } else {
              await Job.updateOne(
                { _id: job._id },
                { status: 'retrying', error: err.message, retries: currentRetries }
              );
              logger.info({ jobId: job._id, retries: currentRetries }, 'Job queued for retry');
            }
          }
        });

        await Promise.allSettled(processPromises);
      } catch (err: any) {
        logger.error({ err }, 'Job polling error');
        await sleep(pollInterval);
      }
    }
  }

  poll();
  logger.info({ type, pollInterval, batchSize }, 'Job processor started');

  return () => {
    running = false;
    logger.info({ type }, 'Job processor stopped');
  };
}

export async function updateJobStatus(
  jobId: string,
  status: IJobDocument['status'],
  data?: { result?: Record<string, any>; error?: string; progress?: number }
): Promise<void> {
  const update: Record<string, any> = { status };
  if (data?.result) update.result = data.result;
  if (data?.error) update.error = data.error;
  if (data?.progress !== undefined) update.progress = data.progress;
  if (status === 'completed') update.completedAt = new Date();
  if (status === 'running') update.startedAt = new Date();

  await Job.updateOne({ _id: jobId }, { $set: update });
}

export async function retryFailedJobs(): Promise<number> {
  const failedJobs = await Job.find({
    status: { $in: ['failed', 'retrying'] },
    retries: { $lt: config.jobs.maxRetries },
  });

  let requeued = 0;
  for (const job of failedJobs) {
    await Job.updateOne(
      { _id: job._id },
      { status: 'pending', error: undefined, $inc: { retries: 1 } }
    );
    requeued++;
  }

  if (requeued > 0) {
    logger.info({ requeued }, 'Failed jobs requeued');
  }

  return requeued;
}

export async function cleanupOldJobs(days: number = 30): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await Job.deleteMany({
    status: 'completed',
    completedAt: { $lt: cutoff },
  });

  if (result.deletedCount > 0) {
    logger.info({ deletedCount: result.deletedCount, days }, 'Old jobs cleaned up');
  }

  return result.deletedCount;
}
