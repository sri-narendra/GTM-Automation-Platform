import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Play, Plus, Trash2, GitBranch, GripVertical,
  Clock, Upload, Globe, MousePointer, Zap, Filter,
  Send, FileText,   Settings2, ChevronDown, ChevronUp, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import { workflowsApi } from '../services/api';
import { cn } from '../lib/utils';
import type { Workflow, WorkflowStep } from '../types';

const triggerTypes = [
  { value: 'manual', label: 'Manual', icon: MousePointer, desc: 'Run manually from dashboard' },
  { value: 'csv_upload', label: 'CSV Upload', icon: Upload, desc: 'Trigger when CSV is uploaded' },
  { value: 'cron', label: 'Schedule', icon: Clock, desc: 'Run on a schedule (cron)' },
  { value: 'webhook', label: 'Webhook', icon: Globe, desc: 'Trigger via webhook URL' },
];

const stepTypes = [
  { value: 'enrich', label: 'Enrich Lead', icon: Zap, desc: 'Enrich lead data with AI', color: 'text-violet-400 bg-violet-500/10' },
  { value: 'filter', label: 'Filter Leads', icon: Filter, desc: 'Filter leads by condition', color: 'text-blue-400 bg-blue-500/10' },
  { value: 'outreach', label: 'Generate Outreach', icon: Send, desc: 'Generate outreach message', color: 'text-emerald-400 bg-emerald-500/10' },
  { value: 'export', label: 'Export', icon: Upload, desc: 'Export results', color: 'text-amber-400 bg-amber-500/10' },
  { value: 'resume', label: 'Optimize Resume', icon: FileText, desc: 'Optimize attached resume', color: 'text-rose-400 bg-rose-500/10' },
];

type NewStep = { type: string; name: string; config: Record<string, any> };

export default function WorkflowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('manual');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [showStepSelector, setShowStepSelector] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const { data: existingWorkflow } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowsApi.get(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingWorkflow) {
      setName(existingWorkflow.name);
      setDescription(existingWorkflow.description || '');
      setTriggerType(existingWorkflow.trigger?.type || 'manual');
      setTriggerConfig(existingWorkflow.trigger?.config || {});
      setSteps(existingWorkflow.steps || []);
    }
  }, [existingWorkflow]);

  const saveMutation = useMutation({
    mutationFn: (data: Partial<Workflow>) =>
      isEditing ? workflowsApi.update(id!, data) : workflowsApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(isEditing ? 'Workflow updated' : 'Workflow created');
      if (!isEditing) navigate(`/workflows/${data._id}/edit`, { replace: true });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to save'),
  });

  const executeMutation = useMutation({
    mutationFn: () => workflowsApi.execute(isEditing ? id! : ''),
    onSuccess: () => {
      toast.success('Workflow execution started');
      setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Execution started...`]);
      navigate('/jobs');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to execute');
      setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Error: ${err.response?.data?.error || 'Execution failed'}`]);
    },
  });

  const addStep = (type: string) => {
    const stepType = stepTypes.find((s) => s.value === type);
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      name: stepType?.label || type,
      config: {},
      position: steps.length,
    };
    setSteps([...steps, newStep]);
    setExpandedStep(newStep.id);
    setShowStepSelector(false);
  };

  const removeStep = (stepId: string) => {
    setSteps(steps.filter((s) => s.id !== stepId));
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setSteps(steps.map((s) => (s.id === stepId ? { ...s, ...updates } : s)));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newSteps.length) return;
    [newSteps[index], newSteps[target]] = [newSteps[target], newSteps[index]];
    setSteps(newSteps.map((s, i) => ({ ...s, position: i })));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Workflow name is required');
      return;
    }
    saveMutation.mutate({
      name: name.trim(),
      description: description.trim(),
      trigger: { type: triggerType, config: triggerConfig },
      steps,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/workflows')} className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700/50 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workflow name..."
              className="bg-transparent text-xl font-bold text-white placeholder-surface-600 focus:outline-none border-b border-transparent focus:border-primary-500/50 pb-0.5"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="bg-transparent text-sm text-surface-400 placeholder-surface-600 focus:outline-none w-full"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-700 text-surface-300 text-sm font-medium hover:bg-surface-700/50 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          <button
            onClick={() => executeMutation.mutate()}
            disabled={executeMutation.isPending || !isEditing || steps.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium disabled:opacity-50 transition-colors shadow-lg shadow-primary-500/20"
          >
            {executeMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Play className="w-4 h-4" />}
            Execute
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5"
          >
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Trigger</h3>
            <div className="grid grid-cols-2 gap-2">
              {triggerTypes.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTriggerType(t.value)}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                    triggerType === t.value
                      ? 'border-primary-500/50 bg-primary-500/10'
                      : 'border-surface-700/50 hover:border-surface-600/50 bg-surface-900/30'
                  )}
                >
                  <t.icon className={cn('w-4 h-4 mt-0.5', triggerType === t.value ? 'text-primary-400' : 'text-surface-500')} />
                  <div>
                    <p className={cn('text-sm font-medium', triggerType === t.value ? 'text-primary-300' : 'text-surface-200')}>
                      {t.label}
                    </p>
                    <p className="text-[11px] text-surface-500 mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {triggerType === 'cron' && (
              <div className="mt-3">
                <input
                  type="text"
                  value={triggerConfig.schedule || ''}
                  onChange={(e) => setTriggerConfig({ ...triggerConfig, schedule: e.target.value })}
                  placeholder="Cron expression (e.g., 0 9 * * 1-5)"
                  className="w-full bg-surface-900/50 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                />
              </div>
            )}
          </motion.div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Steps ({steps.length})</h3>
              <button
                onClick={() => setShowStepSelector(!showStepSelector)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600/10 border border-primary-500/20 text-primary-400 text-xs font-medium hover:bg-primary-600/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>

            <AnimatePresence>
              {showStepSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl border border-surface-700/50 bg-surface-800/50 p-3"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {stepTypes.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => addStep(s.value)}
                        className="flex items-center gap-2.5 p-3 rounded-lg border border-surface-700/50 hover:border-surface-600/50 hover:bg-surface-700/30 transition-all text-left"
                      >
                        <div className={`p-1.5 rounded-lg ${s.color}`}>
                          <s.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-surface-200">{s.label}</p>
                          <p className="text-[10px] text-surface-500">{s.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {steps.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-surface-700/30 p-12 text-center">
                <GitBranch className="w-8 h-8 text-surface-600 mx-auto mb-2" />
                <p className="text-sm text-surface-500">No steps yet. Click "Add Step" to build your workflow.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <button onClick={() => moveStep(index, 'up')} disabled={index === 0} className="text-surface-600 hover:text-surface-400 disabled:opacity-30">
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button onClick={() => moveStep(index, 'down')} disabled={index === steps.length - 1} className="text-surface-600 hover:text-surface-400 disabled:opacity-30">
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                        className="flex-1 flex items-center gap-2.5 text-left"
                      >
                        <div className={`p-1.5 rounded-lg ${stepTypes.find((s) => s.value === step.type)?.color || 'bg-surface-700/50'}`}>
                          {(() => {
                            const Icon = stepTypes.find((s) => s.value === step.type)?.icon;
                            return Icon ? <Icon className="w-4 h-4" /> : <Zap className="w-4 h-4" />;
                          })()}
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            value={step.name}
                            onChange={(e) => updateStep(step.id, { name: e.target.value })}
                            className="bg-transparent text-sm font-medium text-white focus:outline-none border-b border-transparent focus:border-primary-500/50"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <span className="text-[11px] text-surface-500 font-mono">Step {index + 1}</span>
                      </button>
                      <button
                        onClick={() => removeStep(step.id)}
                        className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-700/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5"
          >
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Execution Log</h3>
            {log.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-6 h-6 text-surface-600 mx-auto mb-2" />
                <p className="text-xs text-surface-500">No logs yet. Execute the workflow to see results.</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-[11px]">
                {log.map((entry, i) => (
                  <p key={i} className="text-surface-400">{entry}</p>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5"
          >
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">Configurations</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-400">Trigger</span>
                <span className="text-sm text-surface-200 capitalize">{triggerType.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-400">Steps</span>
                <span className="text-sm text-surface-200">{steps.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-400">Status</span>
                <span className={cn('text-sm', isEditing ? 'text-emerald-400' : 'text-amber-400')}>
                  {isEditing ? 'Saved' : 'New'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
