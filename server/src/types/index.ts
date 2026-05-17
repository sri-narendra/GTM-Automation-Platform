export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILead {
  _id: string;
  userId: string;
  domain?: string;
  linkedinUrl?: string;
  companyName?: string;
  companyDescription?: string;
  industry?: string;
  size?: string;
  location?: string;
  founded?: string;
  technologies: string[];
  targetAudience?: string;
  painPoints: string[];
  category?: string;
  summary?: string;
  hiringPage?: string;
  isHiring?: boolean;
  email?: string;
  phone?: string;
  socialLinks: string[];
  enrichedAt?: Date;
  status: 'pending' | 'enriching' | 'enriched' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkflow {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  trigger: {
    type: 'csv_upload' | 'cron' | 'webhook' | 'manual';
    config: Record<string, any>;
  };
  steps: IWorkflowStep[];
  status: 'active' | 'paused' | 'draft' | 'archived';
  lastRun?: Date;
  runCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkflowStep {
  id: string;
  type: 'enrich_lead' | 'scrape_website' | 'summarize_ai' | 'generate_outreach' | 'optimize_resume' | 'send_webhook' | 'classify_lead' | 'score_lead' | 'filter' | 'delay';
  name: string;
  config: Record<string, any>;
  position: number;
}

export interface IJob {
  _id: string;
  userId: string;
  workflowId?: string;
  type: 'enrichment' | 'scraping' | 'ai_research' | 'outreach' | 'resume_optimization' | 'workflow' | 'bulk_enrich';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  progress: number;
  payload: Record<string, any>;
  result?: Record<string, any>;
  error?: string;
  retries: number;
  maxRetries: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IResume {
  _id: string;
  userId: string;
  originalFilename: string;
  content: string;
  parsedData?: {
    name?: string;
    email?: string;
    phone?: string;
    skills: string[];
    experience: IExperience[];
    education: IEducation[];
  };
  optimizations: IResumeOptimization[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IExperience {
  title: string;
  company: string;
  duration: string;
  description: string[];
}

export interface IEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface IResumeOptimization {
  jobDescription: string;
  originalBullets: string[];
  optimizedBullets: string[];
  atsScore?: number;
  matchRate?: number;
  missingKeywords: string[];
  coverLetter?: string;
  recruiterEmail?: string;
  createdAt: Date;
}

export interface IOutreach {
  _id: string;
  userId: string;
  leadId?: string;
  type: 'cold_email' | 'linkedin' | 'follow_up';
  leadInfo: {
    companyName: string;
    contactName?: string;
    role?: string;
    industry?: string;
  };
  content: string;
  subject?: string;
  tone: 'professional' | 'friendly' | 'formal';
  generatedAt: Date;
  createdAt: Date;
}

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
export type LeadStatus = 'pending' | 'enriching' | 'enriched' | 'failed';
export type WorkflowStatus = 'active' | 'paused' | 'draft' | 'archived';
export type OutreachType = 'cold_email' | 'linkedin' | 'follow_up';
export type OutreachTone = 'professional' | 'friendly' | 'formal';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface EnrichmentResult {
  companyName: string;
  description: string;
  industry: string;
  size: string;
  location: string;
  founded: string;
  technologies: string[];
  socialLinks: string[];
  targetAudience: string;
  painPoints: string[];
  category: string;
  summary: string;
  hiringPage: string;
  isHiring: boolean;
}

export interface ScrapingResult {
  title: string;
  description: string;
  keywords: string[];
  technologies: string[];
  email: string;
  phone: string;
  socialLinks: string[];
  hiringPage: string;
  isHiring: boolean;
}

export interface AIResearchResult {
  summary: string;
  targetAudience: string;
  painPoints: string[];
  category: string;
  insights: string[];
  competitiveAdvantages: string[];
  recommendedApproach: string;
}

export interface ResumeOptimizationResult {
  optimizedBullets: string[];
  atsScore: number;
  matchRate: number;
  missingKeywords: string[];
  suggestions: string[];
  coverLetter: string;
  recruiterEmail: string;
}
