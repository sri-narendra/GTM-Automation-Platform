import OpenAI from 'openai';
import { config } from '../../config';
import { AIProvider } from './index';

const groqClient = new OpenAI({
  apiKey: config.groq.apiKey,
  baseURL: 'https://api.groq.com/openai/v1',
});

const MODEL = config.groq.model;

export const groqProvider: AIProvider = {
  name: 'groq',
  async createChatCompletion(
    messages: { role: string; content: string }[],
    options: { temperature?: number; maxTokens?: number }
  ): Promise<string | null> {
    if (!config.groq.apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }
    const response = await groqClient.chat.completions.create({
      model: MODEL,
      messages: messages as any,
      temperature: options.temperature ?? 0.5,
      max_tokens: options.maxTokens ?? 500,
    });
    return response.choices[0]?.message?.content?.trim() ?? null;
  },
};
