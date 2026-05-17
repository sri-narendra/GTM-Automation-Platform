import axios from 'axios';
import type {
  User, Lead, Workflow, Job, Resume, Outreach,
  DashboardStats, ApiResponse
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

const handleResponse = async <T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> => {
  const { data } = await promise;
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data.data as T;
};

export const authApi = {
  login: (email: string, password: string) =>
    handleResponse<{ token: string; user: User }>(api.post('/auth/login', { email, password })),
  register: (email: string, password: string, name: string) =>
    handleResponse<{ token: string; user: User }>(api.post('/auth/register', { email, password, name })),
  getMe: () => handleResponse<User>(api.get('/auth/me')),
  updateProfile: (data: Partial<User>) => handleResponse<User>(api.put('/auth/profile', data)),
};

export const leadsApi = {
  list: (params?: any) => handleResponse<Lead[]>(api.get('/leads', { params })),
  get: (id: string) => handleResponse<Lead>(api.get(`/leads/${id}`)),
  create: (data: Partial<Lead>) => handleResponse<Lead>(api.post('/leads', data)),
  batchCreate: (data: Partial<Lead>[]) => handleResponse<Lead[]>(api.post('/leads/batch', { leads: data })),
  update: (id: string, data: Partial<Lead>) => handleResponse<Lead>(api.put(`/leads/${id}`, data)),
  remove: (id: string) => handleResponse<void>(api.delete(`/leads/${id}`)),
  enrich: (id: string) => handleResponse<Lead>(api.post(`/leads/${id}/enrich`)),
  batchEnrich: (ids: string[]) => handleResponse<{ jobId: string }>(api.post('/leads/batch-enrich', { ids })),
  getStats: () => handleResponse<any>(api.get('/leads/stats')),
};

export const workflowsApi = {
  list: () => handleResponse<Workflow[]>(api.get('/workflows')),
  get: (id: string) => handleResponse<Workflow>(api.get(`/workflows/${id}`)),
  create: (data: Partial<Workflow>) => handleResponse<Workflow>(api.post('/workflows', data)),
  update: (id: string, data: Partial<Workflow>) => handleResponse<Workflow>(api.put(`/workflows/${id}`, data)),
  remove: (id: string) => handleResponse<void>(api.delete(`/workflows/${id}`)),
  execute: (id: string) => handleResponse<{ jobId: string }>(api.post(`/workflows/${id}/execute`)),
  toggle: (id: string) => handleResponse<Workflow>(api.post(`/workflows/${id}/toggle`)),
  duplicate: (id: string) => handleResponse<Workflow>(api.post(`/workflows/${id}/duplicate`)),
};

export const jobsApi = {
  list: (params?: any) => handleResponse<Job[]>(api.get('/jobs', { params })),
  get: (id: string) => handleResponse<Job>(api.get(`/jobs/${id}`)),
  retry: (id: string) => handleResponse<Job>(api.post(`/jobs/${id}/retry`)),
  cancel: (id: string) => handleResponse<Job>(api.post(`/jobs/${id}/cancel`)),
  cleanup: () => handleResponse<void>(api.post('/jobs/cleanup')),
  getStats: () => handleResponse<any>(api.get('/jobs/stats')),
};

export const outreachApi = {
  list: () => handleResponse<Outreach[]>(api.get('/outreach')),
  get: (id: string) => handleResponse<Outreach>(api.get(`/outreach/${id}`)),
  generate: (data: { type: string; leadId: string; tone: string }) =>
    handleResponse<Outreach>(api.post('/outreach/generate', data)),
  batchGenerate: (data: { type: string; leadIds: string[]; tone: string }) =>
    handleResponse<Outreach[]>(api.post('/outreach/batch-generate', data)),
  remove: (id: string) => handleResponse<void>(api.delete(`/outreach/${id}`)),
};

export const resumesApi = {
  upload: (formData: FormData) =>
    handleResponse<Resume>(api.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })),
  list: () => handleResponse<Resume[]>(api.get('/resumes')),
  get: (id: string) => handleResponse<Resume>(api.get(`/resumes/${id}`)),
  optimize: (id: string, jobDescription: string) =>
    handleResponse<Resume>(api.post(`/resumes/${id}/optimize`, { jobDescription })),
  remove: (id: string) => handleResponse<void>(api.delete(`/resumes/${id}`)),
};

export const statsApi = {
  getDashboard: () => handleResponse<DashboardStats>(api.get('/stats/dashboard')),
};

export default api;
