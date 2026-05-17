export interface User {
  _id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  credits: number;
}

export interface Lead {
  _id: string;
  domain?: string;
  linkedinUrl?: string;
  companyName?: string;
  companyDescription?: string;
  industry?: string;
  size?: string;
  location?: string;
  technologies: string[];
  summary?: string;
  category?: string;
  enrichedData?: {
    summary?: string;
    technologies?: string[];
    audience?: string[];
    painPoints?: string[];
    funding?: string;
    competitors?: string[];
    socialLinks?: string[];
    recentNews?: string[];
  };
  status: string;
  createdAt: string;
}

export interface Workflow {
  _id: string;
  name: string;
  description?: string;
  trigger: {
    type: string;
    config: any;
  };
  steps: WorkflowStep[];
  status: string;
  runCount: number;
  lastRun?: string;
  createdAt: string;
}

export interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: any;
  position: number;
}

export interface Job {
  _id: string;
  type: string;
  status: string;
  progress: number;
  error?: string;
  retries: number;
  createdAt: string;
}

export interface Resume {
  _id: string;
  originalFilename: string;
  parsedData?: {
    name?: string;
    skills: string[];
    experience: any[];
  };
  optimizations: any[];
  createdAt: string;
}

export interface Outreach {
  _id: string;
  type: string;
  leadInfo: {
    companyName: string;
    contactName?: string;
    role?: string;
  };
  content: string;
  subject?: string;
  tone: string;
  generatedAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  totalWorkflows: number;
  totalJobs: number;
  totalResumes: number;
  activeWorkflows: number;
  failedJobs: number;
  recentJobs: Job[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}
