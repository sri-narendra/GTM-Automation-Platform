import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Download, Sparkles, CheckCircle2,
  XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp,
  Mail, MessageSquare, Copy, Check, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { resumesApi } from '../services/api';
import { formatDate } from '../lib/utils';
import EmptyState from '../components/ui/EmptyState';
import type { Resume } from '../types';

type Tab = 'optimize' | 'cover-letter' | 'recruiter-email' | 'history';

export default function ResumeOptimizer() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>('optimize');
  const [selectedResume, setSelectedResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('original');

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => resumesApi.list(),
  });

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => resumesApi.upload(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setSelectedResume(data._id);
      toast.success('Resume uploaded');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Resume deleted');
    },
    onError: (err: any) => toast.error('Failed to delete'),
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(pdf|docx?|txt)$/i)) {
      toast.error('Please upload a PDF, DOCX, or TXT file');
      return;
    }
    const formData = new FormData();
    formData.append('resume', file);
    uploadMutation.mutate(formData);
  };

  const handleOptimize = async () => {
    if (!selectedResume) { toast.error('Please upload a resume first'); return; }
    if (!jobDescription.trim()) { toast.error('Please paste a job description'); return; }
    setOptimizing(true);
    try {
      const data = await resumesApi.optimize(selectedResume, jobDescription);
      setResult(data);
      toast.success('Resume optimized!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied');
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error('Failed to copy'); }
  };

  const currentResume = resumes?.find((r) => r._id === selectedResume);
  const atsScore = result?.optimizations?.[0]?.atsScore || 75;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'optimize', label: 'Optimize', icon: Sparkles },
    { id: 'cover-letter', label: 'Cover Letter', icon: FileText },
    { id: 'recruiter-email', label: 'Recruiter Email', icon: Mail },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-white">Resume Optimizer</h2>
        <p className="text-sm text-surface-400">Optimize your resume for any job description with AI</p>
      </motion.div>

      <div className="flex gap-1 p-1 rounded-xl bg-surface-800/50 border border-surface-700/30 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-surface-700 text-white shadow-sm'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'history' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-6"
        >
          <h3 className="text-sm font-semibold text-white mb-4">Optimization History</h3>
          {!resumes || resumes.length === 0 ? (
            <EmptyState icon={FileText} title="No resumes yet" description="Upload your first resume to get started." />
          ) : (
            <div className="space-y-3">
              {resumes.map((r, i) => (
                <motion.div
                  key={r._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-900/30 border border-surface-700/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-500/10">
                      <FileText className="w-4 h-4 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-200">{r.originalFilename}</p>
                      <p className="text-xs text-surface-500">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedResume(r._id); setActiveTab('optimize'); }}
                      className="px-3 py-1.5 rounded-lg bg-primary-600/10 border border-primary-500/20 text-primary-400 text-xs font-medium hover:bg-primary-600/20 transition-colors"
                    >
                      Optimize
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(r._id)}
                      className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-700/50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5"
            >
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Upload Resume</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                className="w-full flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed border-surface-700/50 hover:border-primary-500/30 hover:bg-surface-700/20 transition-all disabled:opacity-50"
              >
                <Upload className="w-8 h-8 text-surface-500" />
                <span className="text-sm text-surface-400 font-medium">
                  {uploadMutation.isPending ? 'Uploading...' : 'Click to upload'}
                </span>
                <span className="text-xs text-surface-500">PDF, DOCX, or TXT</span>
              </button>

              {currentResume && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-300">{currentResume.originalFilename}</span>
                </div>
              )}

              <div className="mt-4 space-y-1">
                <label className="text-xs font-medium text-surface-400">Job Description</label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={10}
                  className="w-full bg-surface-900/50 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-none"
                  placeholder="Paste the job description here..."
                />
              </div>

              <button
                onClick={handleOptimize}
                disabled={optimizing || !selectedResume || !jobDescription.trim()}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/20"
              >
                {optimizing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {optimizing ? 'Optimizing...' : 'Optimize Resume'}
              </button>
            </motion.div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {result ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">ATS Score</h3>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.5" fill="none"
                          stroke={atsScore >= 80 ? '#10b981' : atsScore >= 60 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="3"
                          strokeDasharray={`${atsScore} ${100 - atsScore}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
                        {atsScore}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      {atsScore >= 80 ? (
                        <div className="flex items-center gap-2 text-sm text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" /> Great match!
                        </div>
                      ) : atsScore >= 60 ? (
                        <div className="flex items-center gap-2 text-sm text-amber-400">
                          <AlertTriangle className="w-4 h-4" /> Room for improvement
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-red-400">
                          <XCircle className="w-4 h-4" /> Needs work
                        </div>
                      )}
                      <p className="text-xs text-surface-500">Keyword match rate</p>
                    </div>
                  </div>
                </div>

                {result.optimizations?.[0]?.missingKeywords?.length > 0 && (
                  <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5">
                    <h3 className="text-sm font-semibold text-white mb-3">Missing Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.optimizations[0].missingKeywords.map((kw: string, i: number) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'cover-letter' ? (
                  <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">Generated Cover Letter</h3>
                      <button
                        onClick={() => handleCopy(result.optimizations?.[0]?.coverLetter || '')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-700/30 hover:bg-surface-700/50 text-surface-300 text-xs font-medium transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy
                      </button>
                    </div>
                    <div className="px-4 py-4 rounded-lg bg-surface-900/50 border border-surface-700/30">
                      <p className="text-sm text-surface-300 whitespace-pre-wrap leading-relaxed">
                        {result.optimizations?.[0]?.coverLetter || 'Generate an optimized resume first to see the cover letter.'}
                      </p>
                    </div>
                  </div>
                ) : activeTab === 'recruiter-email' ? (
                  <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">Recruiter Email Template</h3>
                      <button
                        onClick={() => handleCopy(result.optimizations?.[0]?.recruiterEmail || '')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-700/30 hover:bg-surface-700/50 text-surface-300 text-xs font-medium transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy
                      </button>
                    </div>
                    <div className="px-4 py-4 rounded-lg bg-surface-900/50 border border-surface-700/30">
                      <p className="text-sm text-surface-300 whitespace-pre-wrap leading-relaxed">
                        {result.optimizations?.[0]?.recruiterEmail || 'Generate an optimized resume first to see the email template.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm overflow-hidden">
                    <div className="border-b border-surface-700/30">
                      <button
                        onClick={() => setExpandedSection(expandedSection === 'original' ? null : 'original')}
                        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-surface-700/20 transition-colors"
                      >
                        <span className="text-sm font-semibold text-surface-400">Original Resume</span>
                        {expandedSection === 'original' ? <ChevronUp className="w-4 h-4 text-surface-500" /> : <ChevronDown className="w-4 h-4 text-surface-500" />}
                      </button>
                      <AnimatePresence>
                        {expandedSection === 'original' && (
                          <motion.div
                            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 py-4 bg-surface-900/30">
                              <p className="text-sm text-surface-300 whitespace-pre-wrap leading-relaxed">
                                {currentResume?.parsedData?.experience?.map((e: any) => e.description).join('\n') || 'Original content...'}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div>
                      <button
                        onClick={() => setExpandedSection(expandedSection === 'optimized' ? null : 'optimized')}
                        className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-surface-700/20 transition-colors"
                      >
                        <span className="text-sm font-semibold text-primary-400">Optimized Resume</span>
                        {expandedSection === 'optimized' ? <ChevronUp className="w-4 h-4 text-surface-500" /> : <ChevronDown className="w-4 h-4 text-surface-500" />}
                      </button>
                      <AnimatePresence>
                        {expandedSection === 'optimized' && (
                          <motion.div
                            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 py-4 bg-surface-900/30 border-t border-surface-700/30">
                              <p className="text-sm text-surface-300 whitespace-pre-wrap leading-relaxed">
                                {result.optimizations?.[0]?.optimizedContent || 'Optimized content...'}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-700/50 hover:bg-surface-700/70 text-white text-sm font-medium transition-colors">
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-surface-700/50 hover:bg-surface-700/70 text-white text-sm font-medium transition-colors">
                    <FileText className="w-4 h-4" /> Download Markdown
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-12">
                <EmptyState
                  icon={FileText}
                  title="Ready to optimize"
                  description="Upload a resume and paste a job description to see AI-powered optimization results."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
