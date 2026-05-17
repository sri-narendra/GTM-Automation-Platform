import { Lead, ILeadDocument } from '../models/Lead';
import { Job } from '../models/Job';
import { scrapeWebsite } from './scraper';
import { generateCompanySummary, classifyCompany, identifyPainPoints } from './openai';
import { logger } from '../utils/logger';
import { EnrichmentResult } from '../types';
import { extractDomain } from '../utils/helpers';

export async function enrichSingleLead(leadId: string, userId: string): Promise<EnrichmentResult> {
  const lead = await Lead.findOne({ _id: leadId, userId });
  if (!lead) {
    throw new Error('Lead not found');
  }

  await Lead.updateOne({ _id: leadId }, { status: 'enriching' });

  try {
    const domain = lead.domain || extractDomain(lead.linkedinUrl || lead.companyName || '');
    let scrapingResult: Partial<import('../types').ScrapingResult> = {};

    if (domain) {
      try {
        scrapingResult = await scrapeWebsite(domain);
      } catch (err) {
        logger.warn({ err, domain }, 'Website scraping failed during enrichment, continuing with partial data');
      }
    }

    const companyName = lead.companyName || scrapingResult.title || domain || 'Unknown Company';
    const companyDescription = lead.companyDescription || scrapingResult.description || '';
    const industry = lead.industry || 'Technology';

    const [summary, category, painPoints] = await Promise.all([
      generateCompanySummary({ name: companyName, description: companyDescription, industry }).catch(() => companyDescription),
      classifyCompany(companyDescription || companyName).catch(() => 'Other'),
      identifyPainPoints(industry, companyDescription || companyName).catch(() => ['Customer acquisition', 'Market competition', 'Operational efficiency']),
    ]);

    const enrichmentResult: EnrichmentResult = {
      companyName,
      description: companyDescription,
      industry,
      size: lead.size || scrapingResult.title || '',
      location: lead.location || '',
      founded: lead.founded || '',
      technologies: [...new Set([...(lead.technologies || []), ...(scrapingResult.technologies || [])])],
      socialLinks: [...new Set([...(lead.socialLinks || []), ...(scrapingResult.socialLinks || [])])],
      targetAudience: lead.targetAudience || '',
      painPoints,
      category,
      summary,
      hiringPage: scrapingResult.hiringPage || '',
      isHiring: scrapingResult.isHiring || false,
    };

    await Lead.updateOne(
      { _id: leadId },
      {
        $set: {
          companyName: enrichmentResult.companyName,
          companyDescription: enrichmentResult.description,
          industry: enrichmentResult.industry,
          size: enrichmentResult.size,
          location: enrichmentResult.location,
          founded: enrichmentResult.founded,
          technologies: enrichmentResult.technologies,
          socialLinks: enrichmentResult.socialLinks,
          targetAudience: enrichmentResult.targetAudience,
          painPoints: enrichmentResult.painPoints,
          category: enrichmentResult.category,
          summary: enrichmentResult.summary,
          hiringPage: enrichmentResult.hiringPage,
          isHiring: enrichmentResult.isHiring,
          email: scrapingResult.email || lead.email,
          phone: scrapingResult.phone || lead.phone,
          enrichedAt: new Date(),
          status: 'enriched',
        },
      }
    );

    logger.info({ leadId, companyName }, 'Lead enriched successfully');
    return enrichmentResult;
  } catch (err: any) {
    await Lead.updateOne({ _id: leadId }, { status: 'failed' });
    logger.error({ err, leadId }, 'Lead enrichment failed');
    throw err;
  }
}

export async function enrichLeadBatch(leadIds: string[], userId: string): Promise<{ enriched: number; failed: number }> {
  let enriched = 0;
  let failed = 0;

  for (const leadId of leadIds) {
    try {
      await enrichSingleLead(leadId, userId);
      enriched++;
    } catch (err) {
      logger.error({ err, leadId }, 'Batch enrichment failed for lead');
      failed++;
    }
  }

  return { enriched, failed };
}
