import OpenAI from 'openai';
import { config } from '../../config';
import { AIProvider } from './index';

const mistralClient = new OpenAI({
  apiKey: config.mistral.apiKey,
  baseURL: 'https://api.mistral.ai/v1',
});

const MODEL = config.mistral.model;

export const mistralProvider: AIProvider = {
  name: 'mistral',
  async createChatCompletion(
    messages: { role: string; content: string }[],
    options: { temperature?: number; maxTokens?: number }
  ): Promise<string | null> {
    if (!config.mistral.apiKey) {
      throw new Error('MISTRAL_API_KEY not configured');
    }
    const response = await mistralClient.chat.completions.create({
      model: MODEL,
      messages: messages as any,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 500,
    });
    return response.choices[0]?.message?.content?.trim() ?? null;
  },
};
