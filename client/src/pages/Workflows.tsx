import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus, GitBranch, Play, Trash2, Copy, ToggleLeft,
  ToggleRight, Clock, Activity, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { workflowsApi } from '../services/api';
import { formatRelativeTime } from '../lib/utils';
import type { Workflow } from '../types';

const triggerIcons: Record<string, string> = {
  csv_upload: '📄',
  cron: '⏰',
  webhook: '🔗',
  manual: '👆',
};

export default function Workflows() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({ name: '', description: '', triggerType: 'manual' });

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Workflow>) => workflowsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow created');
      setShowCreate(false);
      navigate(`/workflows/${data._id}/edit`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create workflow'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workflowsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow deleted');
      setShowDelete(null);
    },
    onError: (err: any) => toast.error('Failed to delete workflow'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => workflowsApi.toggle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow toggled');
    },
    onError: (err: any) => toast.error('Failed to toggle workflow'),
  });

  const executeMutation = useMutation({
    mutationFn: (id: string) => workflowsApi.execute(id),
    onSuccess: () => {
      toast.success('Workflow execution started');
      navigate('/jobs');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to execute workflow'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => workflowsApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success('Workflow duplicated');
    },
    onError: (err: any) => toast.error('Failed to duplicate workflow'),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-bold text-white">Workflows</h2>
          <p className="text-sm text-surface-400">Automate your GTM processes</p>
        </div>
        <button
          onClick={() => navigate('/workflows/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors shadow-lg shadow-primary-500/20"
        >
          <Plus className="w-4 h-4" /> New Workflow
        </button>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-surface-800/50 border border-surface-700/30 animate-pulse" />
          ))}
        </div>
      ) : !workflows || workflows.length === 0 ? (
        <EmptyState
          icon={GitBranch}
          title="No workflows yet"
          description="Create your first workflow to automate lead enrichment, outreach, and more."
          action={{ label: 'Create Workflow', onClick: () => navigate('/workflows/new') }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((w, i) => (
            <motion.div
              key={w._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5 hover:border-surface-600/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{triggerIcons[w.trigger?.type] || '⚡'}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{w.name}</h3>
                    {w.description && (
                      <p className="text-xs text-surface-500 mt-0.5 line-clamp-1">{w.description}</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={w.status} />
              </div>

              <div className="flex items-center gap-3 text-xs text-surface-500 mb-4">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {w.runCount} runs
                </span>
                {w.lastRun && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(w.lastRun)}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {w.steps?.length || 0} steps
                </span>
              </div>

              <div className="flex items-center gap-1 pt-3 border-t border-surface-700/30">
                <button
                  onClick={() => navigate(`/workflows/${w._id}/edit`)}
                  className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-400 hover:text-white hover:bg-surface-700/50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggleMutation.mutate(w._id)}
                  className="p-1.5 rounded-lg text-surface-500 hover:text-primary-400 hover:bg-surface-700/50 transition-colors"
                  title={w.status === 'active' ? 'Pause' : 'Activate'}
                >
                  {w.status === 'active' ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => executeMutation.mutate(w._id)}
                  disabled={w.status !== 'active'}
                  className="p-1.5 rounded-lg text-surface-500 hover:text-emerald-400 hover:bg-surface-700/50 disabled:opacity-30 transition-colors"
                  title="Execute"
                >
                  <Play className="w-4 h-4" />
                </button>
                <button
                  onClick={() => duplicateMutation.mutate(w._id)}
                  className="p-1.5 rounded-lg text-surface-500 hover:text-violet-400 hover:bg-surface-700/50 transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDelete(w._id)}
                  className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-700/50 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Delete Workflow" size="sm">
        <p className="text-sm text-surface-300 mb-6">Are you sure you want to delete this workflow? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDelete(null)}
            className="flex-1 px-4 py-2 rounded-lg border border-surface-700 text-surface-300 text-sm font-medium hover:bg-surface-700/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => showDelete && deleteMutation.mutate(showDelete)}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
