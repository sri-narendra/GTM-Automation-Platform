import { Outreach, IOutreachDocument } from '../models/Outreach';
import { generateOutreach } from './openai';
import { logger } from '../utils/logger';
import { OutreachType, OutreachTone } from '../types';

export async function generateSingleOutreach(params: {
  userId: string;
  leadId?: string;
  type: OutreachType;
  leadInfo: { companyName: string; contactName?: string; role?: string; industry?: string };
  tone: OutreachTone;
}): Promise<IOutreachDocument> {
  const { subject, content } = await generateOutreach(params.leadInfo, params.type, params.tone);

  const outreach = await Outreach.create({
    userId: params.userId,
    leadId: params.leadId,
    type: params.type,
    leadInfo: params.leadInfo,
    content,
    subject,
    tone: params.tone,
  });

  logger.info({ outreachId: outreach._id, type: params.type, company: params.leadInfo.companyName }, 'Outreach generated');
  return outreach;
}

export async function generateBatchOutreach(
  params: {
    userId: string;
    leads: Array<{
      leadId?: string;
      companyName: string;
      contactName?: string;
      role?: string;
      industry?: string;
    }>;
    type: OutreachType;
    tone: OutreachTone;
  }
): Promise<IOutreachDocument[]> {
  const results: IOutreachDocument[] = [];

  for (const lead of params.leads) {
    try {
      const outreach = await generateSingleOutreach({
        userId: params.userId,
        leadId: lead.leadId,
        type: params.type,
        leadInfo: {
          companyName: lead.companyName,
          contactName: lead.contactName,
          role: lead.role,
          industry: lead.industry,
        },
        tone: params.tone,
      });
      results.push(outreach);
    } catch (err: any) {
      logger.error({ err, company: lead.companyName }, 'Batch outreach generation failed for lead');
    }
  }

  return results;
}

export async function getOutreachStats(userId: string): Promise<{ total: number; byType: Record<string, number> }> {
  const total = await Outreach.countDocuments({ userId });
  const byTypeRaw = await Outreach.aggregate([
    { $match: { userId: userId as any } },
    { $group: { _id: '$type', count: { $sum: 1 } } },
  ]);
  const byType: Record<string, number> = {};
  for (const item of byTypeRaw) {
    byType[item._id] = item.count;
  }
  return { total, byType };
}
