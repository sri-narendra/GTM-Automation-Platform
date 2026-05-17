export type AITask =
  | 'generateCompanySummary'
  | 'classifyCompany'
  | 'identifyPainPoints'
  | 'generateOutreach'
  | 'optimizeResumeBullets'
  | 'generateCoverLetter'
  | 'generateRecruiterEmail'
  | 'scoreResume'
  | 'analyzeJobDescription'
  | 'generateFollowUp';

export interface ProviderConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface AIProvider {
  name: string;
  createChatCompletion(messages: { role: string; content: string }[], options: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<string | null>;
}

export interface FunctionCall<T> {
  task: AITask;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  parseResponse?: (content: string | null) => T | null;
  fallbackValue: T;
}
