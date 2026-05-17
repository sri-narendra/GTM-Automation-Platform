import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Briefcase, RefreshCw, XCircle, Trash2, Filter,
  Play, AlertCircle, CheckCircle, Clock, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { jobsApi } from '../services/api';
import { formatRelativeTime, cn } from '../lib/utils';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import type { Job } from '../types';

const typeColors: Record<string, string> = {
  enrich: 'bg-violet-500/10 text-violet-400',
  outreach: 'bg-emerald-500/10 text-emerald-400',
  optimize_resume: 'bg-amber-500/10 text-amber-400',
  workflow: 'bg-blue-500/10 text-blue-400',
};

export default function Jobs() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs', filterType, filterStatus],
    queryFn: () => jobsApi.list({ type: filterType || undefined, status: filterStatus || undefined }),
    refetchInterval: (query) => {
      const hasRunning = query.state.data?.some((j: Job) => j.status === 'running' || j.status === 'pending');
      return hasRunning ? 5000 : false;
    },
  });

  const retryMutation = useMutation({
    mutationFn: (id: string) => jobsApi.retry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job retry initiated');
    },
    onError: (err: any) => toast.error('Failed to retry job'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => jobsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job cancelled');
    },
    onError: (err: any) => toast.error('Failed to cancel job'),
  });

  const cleanupMutation = useMutation({
    mutationFn: () => jobsApi.cleanup(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Old jobs cleaned up');
    },
    onError: (err: any) => toast.error('Failed to clean up jobs'),
  });

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500';
      case 'failed': return 'bg-red-500';
      case 'running': return 'bg-blue-500';
      case 'pending': return 'bg-amber-500';
      default: return 'bg-surface-500';
    }
  };

  const columns = [
    {
      key: 'type', header: 'Type',
      render: (j: Job) => (
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-lg', typeColors[j.type] || 'bg-surface-700/50 text-surface-400')}>
            {j.type === 'enrich' ? <RefreshCw className="w-4 h-4" /> :
             j.type === 'outreach' ? <Play className="w-4 h-4" /> :
             j.type === 'optimize_resume' ? <Briefcase className="w-4 h-4" /> :
             <Briefcase className="w-4 h-4" />}
          </div>
          <span className="text-sm font-medium text-white capitalize">{j.type.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'status', header: 'Status',
      render: (j: Job) => <StatusBadge status={j.status} />,
    },
    {
      key: 'progress', header: 'Progress',
      render: (j: Job) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-surface-700 max-w-24">
            <div
              className={cn('h-full rounded-full transition-all duration-500', getProgressColor(j.status))}
              style={{ width: `${j.progress}%` }}
            />
          </div>
          <span className="text-xs text-surface-500 font-mono w-8">{j.progress}%</span>
        </div>
      ),
    },
    {
      key: 'retries', header: 'Retries',
      render: (j: Job) => (
        <span className="text-sm text-surface-400 font-mono">{j.retries}</span>
      ),
    },
    {
      key: 'createdAt', header: 'Created',
      render: (j: Job) => (
        <span className="text-xs text-surface-500">{formatRelativeTime(j.createdAt)}</span>
      ),
    },
    {
      key: 'actions', header: '',
      className: 'w-24',
      render: (j: Job) => (
        <div className="flex items-center gap-1">
          {j.status === 'failed' && (
            <button onClick={() => retryMutation.mutate(j._id)} className="p-1.5 rounded-lg text-surface-500 hover:text-emerald-400 hover:bg-surface-700/50 transition-colors" title="Retry">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {(j.status === 'running' || j.status === 'pending') && (
            <button onClick={() => cancelMutation.mutate(j._id)} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-700/50 transition-colors" title="Cancel">
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-xl font-bold text-white">Jobs</h2>
          <p className="text-sm text-surface-400">Monitor and manage background tasks</p>
        </div>
        <button
          onClick={() => cleanupMutation.mutate()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-surface-700 text-surface-300 text-sm font-medium hover:bg-surface-700/50 transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Cleanup Old
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-3"
      >
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-surface-800/50 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">All Types</option>
          <option value="enrich">Enrich</option>
          <option value="outreach">Outreach</option>
          <option value="optimize_resume">Resume</option>
          <option value="workflow">Workflow</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-surface-800/50 border border-surface-700/50 rounded-lg px-3 py-2 text-sm text-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-surface-700/30 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-surface-400">Failed to load jobs</p>
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs yet"
            description="Jobs will appear here when you run workflows, enrich leads, or generate outreach."
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-700/50">
                {['Type', 'Status', 'Progress', 'Retries', 'Created', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/30">
              {jobs.map((job, i) => (
                <motion.tr
                  key={job._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-surface-700/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1.5 rounded-lg', typeColors[job.type] || 'bg-surface-700/50 text-surface-400')}>
                        {job.type === 'enrich' ? <RefreshCw className="w-4 h-4" /> :
                         job.type === 'outreach' ? <Play className="w-4 h-4" /> :
                         <Briefcase className="w-4 h-4" />}
                      </div>
                      <span className="text-sm font-medium text-white capitalize">{job.type.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={job.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-surface-700">
                        <div className={cn('h-full rounded-full transition-all duration-500', getProgressColor(job.status))} style={{ width: `${job.progress}%` }} />
                      </div>
                      <span className="text-xs text-surface-500 font-mono">{job.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-sm text-surface-400 font-mono">{job.retries}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-surface-500">{formatRelativeTime(job.createdAt)}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {job.status === 'failed' && (
                        <button onClick={() => retryMutation.mutate(job._id)} className="p-1.5 rounded-lg text-surface-500 hover:text-emerald-400 hover:bg-surface-700/50 transition-colors" title="Retry">
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      {(job.status === 'running' || job.status === 'pending') && (
                        <button onClick={() => cancelMutation.mutate(job._id)} className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-700/50 transition-colors" title="Cancel">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
