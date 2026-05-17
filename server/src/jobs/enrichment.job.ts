import { Job, IJobDocument } from '../models/Job';
import { Lead } from '../models/Lead';
import { enrichSingleLead } from '../services/enrichment';
import { updateJobStatus } from '../services/jobQueue';
import { logger } from '../utils/logger';

export async function processEnrichmentJob(job: IJobDocument): Promise<void> {
  const { leadId, leadIds } = job.payload;

  if (leadIds && Array.isArray(leadIds)) {
    let enriched = 0;
    let failed = 0;
    const total = leadIds.length;

    for (let i = 0; i < leadIds.length; i++) {
      try {
        await enrichSingleLead(leadIds[i], job.userId.toString());
        enriched++;
      } catch (err: any) {
        logger.error({ err, leadId: leadIds[i] }, 'Enrichment job failed for lead in batch');
        failed++;
      }

      const progress = Math.round(((i + 1) / total) * 100);
      await updateJobStatus(job._id.toString(), 'running', { progress });
    }

    await updateJobStatus(job._id.toString(), 'completed', {
      result: { enriched, failed, total },
      progress: 100,
    });
  } else if (leadId) {
    try {
      const result = await enrichSingleLead(leadId, job.userId.toString());
      await updateJobStatus(job._id.toString(), 'completed', {
        result,
        progress: 100,
      });
    } catch (err: any) {
      await updateJobStatus(job._id.toString(), 'failed', {
        error: err.message,
      });
      throw err;
    }
  } else {
    throw new Error('Enrichment job payload must contain leadId or leadIds');
  }
}
