import { Workflow } from '../models/Workflow';
import { Job, IJobDocument } from '../models/Job';
import { Lead } from '../models/Lead';
import { scrapeWebsite } from '../services/scraper';
import { generateCompanySummary, classifyCompany, identifyPainPoints, generateOutreach } from '../services/openai';
import { updateJobStatus } from '../services/jobQueue';
import { logger } from '../utils/logger';
import { sleep } from '../utils/helpers';
import { IWorkflowStep } from '../types';

export async function executeWorkflowJob(job: IJobDocument): Promise<void> {
  const { workflowId, steps } = job.payload;

  if (!workflowId || !steps) {
    throw new Error('Workflow job payload missing workflowId or steps');
  }

  const workflow = await Workflow.findById(workflowId);
  if (!workflow) {
    throw new Error('Workflow not found');
  }

  if (workflow.status === 'paused' || (workflow.status as string) === 'archived') {
    logger.info({ workflowId }, 'Workflow is paused/archived, skipping execution');
    return;
  }

    const sortedSteps: any[] = [...steps].sort((a, b) => a.position - b.position);
  const context: Record<string, any> = {};
  const totalSteps = sortedSteps.length;

  for (let i = 0; i < sortedSteps.length; i++) {
    const step = sortedSteps[i];

    if ((workflow.status as string) === 'paused' || (workflow.status as string) === 'archived') {
      logger.info({ workflowId }, 'Workflow paused/archived during execution, aborting');
      break;
    }

    logger.info({ workflowId, step: step.name, stepType: step.type, position: step.position }, 'Executing workflow step');

    try {
      await executeStep(step, context, job.userId.toString());
      const progress = Math.round(((i + 1) / totalSteps) * 100);
      await updateJobStatus(job._id.toString(), 'running', { progress });
    } catch (err: any) {
      logger.error({ err, workflowId, step: step.name }, 'Workflow step failed');
      context.lastError = err.message;
      context.failedStep = step;

      if (step.config.continueOnError !== true) {
        await updateJobStatus(job._id.toString(), 'failed', {
          error: `Step "${step.name}" failed: ${err.message}`,
          progress: Math.round(((i + 1) / totalSteps) * 100),
        });
        return;
      }
    }
  }

  if (context.failedStep) {
    await updateJobStatus(job._id.toString(), 'completed', {
      result: { context, completedWithErrors: true },
      progress: 100,
    });
  } else {
    await updateJobStatus(job._id.toString(), 'completed', {
      result: { context },
      progress: 100,
    });
  }

  logger.info({ workflowId }, 'Workflow execution completed');
}

async function executeStep(step: IWorkflowStep, context: Record<string, any>, userId: string): Promise<void> {
  switch (step.type) {
    case 'enrich_lead': {
      const leadId = step.config.leadId || context.leadId;
      if (!leadId) throw new Error('enrich_lead step requires leadId in config or context');
      const lead = await Lead.findOne({ _id: leadId, userId });
      if (!lead) throw new Error(`Lead ${leadId} not found`);
      await Lead.updateOne({ _id: leadId }, { status: 'enriching' });
      context.enrichedLead = leadId;
      break;
    }

    case 'scrape_website': {
      const url = step.config.url || context.url;
      if (!url) throw new Error('scrape_website step requires url in config or context');
      const result = await scrapeWebsite(url);
      context.scrapingResult = result;
      break;
    }

    case 'summarize_ai': {
      const companyData = step.config.companyData || context.companyData || context.scrapingResult;
      if (!companyData) throw new Error('summarize_ai step requires company data');
      context.summary = await generateCompanySummary(companyData);
      break;
    }

    case 'classify_lead': {
      const description = step.config.description || context.scrapingResult?.description || context.summary;
      if (!description) throw new Error('classify_lead step requires description');
      context.category = await classifyCompany(description);
      break;
    }

    case 'generate_outreach': {
      const companyInfo = step.config.companyInfo || {
        companyName: context.scrapingResult?.title || context.companyName || 'Company',
        industry: context.category || context.scrapingResult?.industry,
      };
      const type = step.config.type || 'cold_email';
      const tone = step.config.tone || 'professional';
      context.outreach = await generateOutreach(companyInfo, type, tone);
      break;
    }

    case 'score_lead': {
      const leadId = step.config.leadId || context.leadId;
      if (!leadId) throw new Error('score_lead step requires leadId');
      const lead = await Lead.findById(leadId);
      context.leadScore = lead ? 70 : 0;
      break;
    }

    case 'filter': {
      const field = step.config.field;
      const operator = step.config.operator || 'equals';
      const value = step.config.value;
      const contextValue = field ? context[field] : undefined;

      if (field && contextValue !== undefined) {
        let passed = false;
        switch (operator) {
          case 'equals': passed = contextValue === value; break;
          case 'contains': passed = String(contextValue).includes(String(value)); break;
          case 'gt': passed = Number(contextValue) > Number(value); break;
          case 'lt': passed = Number(contextValue) < Number(value); break;
          case 'exists': passed = contextValue !== undefined && contextValue !== null; break;
          default: passed = true;
        }
        context.filterPassed = passed;
        if (!passed) {
          logger.info({ field, operator, value }, 'Filter step blocked execution');
        }
      }
      break;
    }

    case 'delay': {
      const ms = step.config.delayMs || step.config.seconds * 1000 || 5000;
      await sleep(ms);
      break;
    }

    case 'send_webhook': {
      const webhookUrl = step.config.url;
      if (!webhookUrl) throw new Error('send_webhook step requires url');
      const axios = (await import('axios')).default;
      await axios.post(webhookUrl, { context, timestamp: new Date().toISOString() }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      });
      break;
    }

    case 'optimize_resume': {
      // Resume optimization would be handled by the resume service
      logger.info({ step: step.name }, 'optimize_resume step - requires resume upload first');
      break;
    }
  }
}
