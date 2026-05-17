import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../utils/logger';
import { sleep } from '../utils/helpers';

const client = new OpenAI({ apiKey: config.openai.apiKey });

const MODEL = config.openai.model;

async function callWithRetry(fn: () => Promise<OpenAI.Chat.Completions.ChatCompletion>, retries: number = 3): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  let lastError: any;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      logger.warn({ err, attempt }, `OpenAI API call failed (attempt ${attempt + 1}/${retries})`);
      if (err.status === 429 || err.status === 500 || err.status === 503) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function parseJSONResponse(content: string | null): any {
  if (!content) return null;
  const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function generateCompanySummary(companyData: { name: string; description?: string; industry?: string }): Promise<string> {
  try {
    const response = await callWithRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a business research analyst. Generate a concise professional company summary (2-3 paragraphs) based on the provided information.',
          },
          {
            role: 'user',
            content: `Generate a professional summary for this company:\nName: ${companyData.name}\nDescription: ${companyData.description || 'N/A'}\nIndustry: ${companyData.industry || 'N/A'}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 500,
      })
    );
    return response.choices[0]?.message?.content?.trim() || companyData.description || '';
  } catch (err: any) {
    logger.error({ err }, 'Failed to generate company summary');
    return companyData.description || '';
  }
}

export async function classifyCompany(description: string): Promise<string> {
  const categories = ['SaaS', 'Marketplace', 'Agency', 'E-commerce', 'Enterprise', 'Healthcare', 'Fintech', 'Edtech', 'Manufacturing', 'Media', 'Consulting', 'Real Estate', 'Logistics', 'Other'];
  try {
    const response = await callWithRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `Classify the company into exactly one category: ${categories.join(', ')}. Respond with only the category name.`,
          },
          { role: 'user', content: description },
        ],
        temperature: 0.3,
        max_tokens: 20,
      })
    );
    const category = response.choices[0]?.message?.content?.trim() || 'Other';
    return categories.includes(category) ? category : 'Other';
  } catch (err: any) {
    logger.error({ err }, 'Failed to classify company');
    return 'Other';
  }
}

export async function identifyPainPoints(industry: string, description: string): Promise<string[]> {
  try {
    const response = await callWithRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Based on the industry and company description, identify 3-5 likely pain points. Return as a JSON array of strings.',
          },
          {
            role: 'user',
            content: `Industry: ${industry}\nCompany Description: ${description}\nReturn a JSON array of pain points.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 300,
      })
    );
    const parsed = parseJSONResponse(response.choices[0]?.message?.content);
    if (Array.isArray(parsed)) return parsed;
    return ['Customer acquisition', 'Market competition', 'Operational efficiency'];
  } catch (err: any) {
    logger.error({ err }, 'Failed to identify pain points');
    return ['Customer acquisition', 'Market competition', 'Operational efficiency'];
  }
}

export async function generateOutreach(
  companyInfo: { companyName: string; contactName?: string; role?: string; industry?: string },
  type: 'cold_email' | 'linkedin' | 'follow_up',
  tone: 'professional' | 'friendly' | 'formal'
): Promise<{ subject: string; content: string }> {
  const toneInstructions: Record<string, string> = {
    professional: 'Use a professional, polished tone. Be direct and value-focused.',
    friendly: 'Use a warm, conversational tone. Be approachable and personable.',
    formal: 'Use a formal, business-appropriate tone. Be respectful and structured.',
  };

  const typeInstructions: Record<string, string> = {
    cold_email: 'Write a cold email that grabs attention, shows research, and proposes value.',
    linkedin: 'Write a LinkedIn connection request or message. Keep it concise and professional.',
    follow_up: 'Write a follow-up message referencing previous communication. Be polite and persistent.',
  };

  try {
    const response = await callWithRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert sales development representative. ${toneInstructions[tone]} ${typeInstructions[type]} Return a JSON object with "subject" (if email) and "content" fields.`,
          },
          {
            role: 'user',
            content: `Generate outreach for:\nCompany: ${companyInfo.companyName}\nContact: ${companyInfo.contactName || 'Decision Maker'}\nRole: ${companyInfo.role || 'Manager'}\nIndustry: ${companyInfo.industry || 'Technology'}\nType: ${type}\nTone: ${tone}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 600,
      })
    );
    const parsed = parseJSONResponse(response.choices[0]?.message?.content);
    if (parsed && parsed.content) {
      return { subject: parsed.subject || '', content: parsed.content };
    }
    const text = response.choices[0]?.message?.content?.trim() || '';
    return { subject: '', content: text };
  } catch (err: any) {
    logger.error({ err }, 'Failed to generate outreach');
    return {
      subject: `Introduction - ${companyInfo.companyName}`,
      content: generateFallbackOutreach(companyInfo, type, tone),
    };
  }
}

function generateFallbackOutreach(companyInfo: { companyName: string; contactName?: string; role?: string; industry?: string }, type: string, _tone: string): string {
  const name = companyInfo.contactName || 'there';
  if (type === 'linkedin') {
    return `Hi ${name}, I came across ${companyInfo.companyName} and was impressed by your work in the ${companyInfo.industry || 'industry'} space. I'd love to connect and explore how we might collaborate.`;
  }
  if (type === 'follow_up') {
    return `Hi ${name}, I wanted to follow up on my previous message. I believe there could be a great opportunity for ${companyInfo.companyName} to leverage our solutions in the ${companyInfo.industry || 'industry'} space. Would you be open to a quick chat?`;
  }
  return `Dear ${name},

I hope this message finds you well. I've been following ${companyInfo.companyName}'s work in the ${companyInfo.industry || 'industry'} space and I believe there may be a valuable opportunity for us to collaborate.

I would love to schedule a brief call to explore how we might be able to support your goals.

Best regards,
[Your Name]`;
}

export async function optimizeResumeBullets(bullets: string[], jobDescription: string): Promise<string[]> {
  try {
    const response = await callWithRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer. Rewrite the given resume bullets to better match the job description. Focus on keywords, measurable achievements, and impact. Return a JSON array of optimized bullet points.',
          },
          {
            role: 'user',
            content: `Job Description:\n${jobDescription}\n\nOriginal Bullets:\n${bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}\n\nReturn a JSON array of optimized bullet points.`,
          },
        ],
        temperature: 0.5,
        max_tokens: 800,
      })
    );
    const parsed = parseJSONResponse(response.choices[0]?.message?.content);
    if (Array.isArray(parsed)) return parsed;
    return bullets;
  } catch (err: any) {
    logger.error({ err }, 'Failed to optimize resume bullets');
    return bullets;
  }
}

export async function generateCoverLetter(candidateInfo: { name: string; skills: string[]; experience: string }, jobDescription: string): Promise<string> {
  try {
    const response = await callWithRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert career coach. Generate a tailored cover letter that highlights the candidate\'s relevant skills and experience for the specific job description.',
          },
          {
            role: 'user',
            content: `Candidate: ${candidateInfo.name}\nSkills: ${candidateInfo.skills.join(', ')}\nExperience: ${candidateInfo.experience}\n\nJob Description:\n${jobDescription}\n\nGenerate a professional cover letter.`,
          },
        ],
        temperature: 0.6,
        max_tokens: 800,
      })
    );
    return response.choices[0]?.message?.content?.trim() || '';
  } catch (err: any) {
    logger.error({ err }, 'Failed to generate cover letter');
    return '';
  }
}

export async function generateRecruiterEmail(candidateInfo: { name: string; skills: string[]; experience: string }, jobDescription: string): Promise<string> {
  try {
    const response = await callWithRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert career coach. Generate a professional outreach email from the candidate to a recruiter, highlighting relevant qualifications for the job.',
          },
          {
            role: 'user',
            content: `Candidate: ${candidateInfo.name}\nSkills: ${candidateInfo.skills.join(', ')}\nExperience: ${candidateInfo.experience}\n\nJob Description:\n${jobDescription}\n\nGenerate a professional recruiter outreach email.`,
          },
        ],
        temperature: 0.6,
        max_tokens: 600,
      })
    );
    return response.choices[0]?.message?.content?.trim() || '';
  } catch (err: any) {
    logger.error({ err }, 'Failed to generate recruiter email');
    return '';
  }
}

export async function scoreResume(resumeText: string, jobDescription: string): Promise<{ atsScore: number; matchRate: number; missingKeywords: string[]; suggestions: string[] }> {
  try {
    const response = await callWithRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an ATS (Applicant Tracking System) expert. Analyze the resume against the job description. Return a JSON object with: atsScore (0-100), matchRate (0-100), missingKeywords (array of important keywords missing from resume), suggestions (array of improvement suggestions).',
          },
          {
            role: 'user',
            content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}\n\nReturn the ATS analysis as JSON.`,
          },
        ],
        temperature: 0.3,
        max_tokens: 600,
      })
    );
    const parsed = parseJSONResponse(response.choices[0]?.message?.content);
    if (parsed && typeof parsed.atsScore === 'number') {
      return {
        atsScore: parsed.atsScore,
        matchRate: parsed.matchRate || parsed.atsScore,
        missingKeywords: parsed.missingKeywords || [],
        suggestions: parsed.suggestions || [],
      };
    }
    return { atsScore: 50, matchRate: 50, missingKeywords: [], suggestions: ['Consider adding more keywords from the job description.'] };
  } catch (err: any) {
    logger.error({ err }, 'Failed to score resume');
    return { atsScore: 50, matchRate: 50, missingKeywords: [], suggestions: [] };
  }
}

export async function analyzeJobDescription(jd: string): Promise<{ skills: string[]; requirements: string[]; keywords: string[] }> {
  try {
    const response = await callWithRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Extract skills, requirements, and keywords from this job description. Return a JSON object with: skills (array), requirements (array), keywords (array).',
          },
          { role: 'user', content: `Job Description:\n${jd}\n\nReturn the extracted information as JSON.` },
        ],
        temperature: 0.3,
        max_tokens: 500,
      })
    );
    const parsed = parseJSONResponse(response.choices[0]?.message?.content);
    if (parsed) {
      return {
        skills: parsed.skills || [],
        requirements: parsed.requirements || [],
        keywords: parsed.keywords || [],
      };
    }
    return { skills: [], requirements: [], keywords: [] };
  } catch (err: any) {
    logger.error({ err }, 'Failed to analyze job description');
    return { skills: [], requirements: [], keywords: [] };
  }
}

export async function generateFollowUp(previousMessage: string, daysSince: number): Promise<string> {
  try {
    const response = await callWithRetry(() =>
      client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert sales development representative. Generate a polite follow-up message that references the previous communication. The message should be respectful and add value, not just "checking in".',
          },
          {
            role: 'user',
            content: `Previous message:\n${previousMessage}\n\nDays since: ${daysSince}\n\nGenerate a follow-up message.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      })
    );
    return response.choices[0]?.message?.content?.trim() || '';
  } catch (err: any) {
    logger.error({ err }, 'Failed to generate follow-up');
    return `Hi there,\n\nI wanted to follow up on my previous message from ${daysSince} days ago. I'd love to hear your thoughts when you have a moment.\n\nBest regards,\n[Your Name]`;
  }
}
