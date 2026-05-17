import { AITask, FunctionCall } from './index';
import { groqProvider } from './groq';
import { mistralProvider } from './mistral';
import { logger } from '../../utils/logger';
import { sleep } from '../../utils/helpers';

const TASK_ROUTING: Record<AITask, { primary: string; fallback: string }> = {
  generateCompanySummary: { primary: 'groq', fallback: 'mistral' },
  classifyCompany: { primary: 'groq', fallback: 'mistral' },
  identifyPainPoints: { primary: 'groq', fallback: 'mistral' },
  analyzeJobDescription: { primary: 'groq', fallback: 'mistral' },
  generateFollowUp: { primary: 'groq', fallback: 'mistral' },
  generateOutreach: { primary: 'mistral', fallback: 'groq' },
  optimizeResumeBullets: { primary: 'mistral', fallback: 'groq' },
  generateCoverLetter: { primary: 'mistral', fallback: 'groq' },
  generateRecruiterEmail: { primary: 'mistral', fallback: 'groq' },
  scoreResume: { primary: 'mistral', fallback: 'groq' },
};

const providers = { groq: groqProvider, mistral: mistralProvider };

async function callProvider(
  providerName: string,
  messages: { role: string; content: string }[],
  options: { temperature?: number; maxTokens?: number },
  retries: number = 2
): Promise<string | null> {
  const provider = providers[providerName as keyof typeof providers];
  if (!provider) throw new Error(`Unknown provider: ${providerName}`);

  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await provider.createChatCompletion(messages, options);
    } catch (err: any) {
      lastError = err;
      logger.warn({ err, provider: providerName, attempt }, `${providerName} call failed (attempt ${attempt + 1}/${retries})`);
      if (err.status === 429 || err.status === 500 || err.status === 503) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export async function executeAI<T>(call: FunctionCall<T>): Promise<T> {
  const routing = TASK_ROUTING[call.task];
  const primaryProvider = routing.primary;
  const fallbackProvider = routing.fallback;

  const messages = [
    { role: 'system', content: call.systemPrompt },
    { role: 'user', content: call.userPrompt },
  ];

  const options = {
    temperature: call.temperature ?? 0.5,
    maxTokens: call.maxTokens ?? 500,
  };

  for (const providerName of [primaryProvider, fallbackProvider]) {
    try {
      const content = await callProvider(providerName, messages, options);
      if (call.parseResponse) {
        const parsed = call.parseResponse(content);
        if (parsed !== null && parsed !== undefined) {
          logger.info({ task: call.task, provider: providerName }, 'AI task completed successfully');
          return parsed;
        }
      }
      if (content) {
        logger.info({ task: call.task, provider: providerName }, 'AI task completed successfully');
        return content as unknown as T;
      }
    } catch (err: any) {
      logger.warn({ err, task: call.task, provider: providerName }, `AI task failed on ${providerName}, trying fallback`);
    }
  }

  logger.warn({ task: call.task }, 'All AI providers failed, returning fallback value');
  return call.fallbackValue;
}
