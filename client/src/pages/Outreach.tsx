import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Send, Copy, Check, Trash2, Sparkles, ChevronDown,
  Target, FileText, MessageSquare, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { outreachApi, leadsApi } from '../services/api';
import { formatDate } from '../lib/utils';
import EmptyState from '../components/ui/EmptyState';
import type { Outreach } from '../types';

const outreachTypes = [
  { value: 'cold_email', label: 'Cold Email', icon: FileText },
  { value: 'linkedin', label: 'LinkedIn Message', icon: MessageSquare },
  { value: 'follow_up', label: 'Follow-up', icon: RefreshCw },
];

const tones = ['professional', 'friendly', 'casual', 'formal', 'warm'];

export default function Outreach() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const initialLeadId = (location.state as any)?.leadId || '';

  const [selectedLead, setSelectedLead] = useState(initialLeadId);
  const [type, setType] = useState('cold_email');
  const [tone, setTone] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<Outreach | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => leadsApi.list({ limit: 200 }),
  });

  const { data: history } = useQuery({
    queryKey: ['outreach'],
    queryFn: () => outreachApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => outreachApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outreach'] });
      toast.success('Deleted');
    },
    onError: (err: any) => toast.error('Failed to delete'),
  });

  const handleGenerate = async () => {
    if (!selectedLead) {
      toast.error('Please select a lead');
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const data = await outreachApi.generate({ type, leadId: selectedLead, tone });
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['outreach'] });
      toast.success('Outreach generated!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const selectedLeadData = leads?.find((l) => l._id === selectedLead);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-white">Outreach Generator</h2>
        <p className="text-sm text-surface-400">Generate personalized outreach messages with AI</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5"
          >
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-surface-400">Select Lead</label>
                <select
                  value={selectedLead}
                  onChange={(e) => setSelectedLead(e.target.value)}
                  className="w-full bg-surface-900/50 border border-surface-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                >
                  <option value="">Choose a lead...</option>
                  {leads?.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.companyName || l.domain || l._id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-surface-400">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {outreachTypes.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        type === t.value
                          ? 'border-primary-500/50 bg-primary-500/10 text-primary-400'
                          : 'border-surface-700/50 text-surface-400 hover:border-surface-600/50 bg-surface-900/30'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-surface-400">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {tones.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        tone === t
                          ? 'border-primary-500/50 bg-primary-500/10 text-primary-400'
                          : 'border-surface-700/50 text-surface-500 hover:text-surface-300 bg-surface-900/30'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating || !selectedLead}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-600 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary-500/20"
              >
                {generating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {generating ? 'Generating...' : 'Generate Outreach'}
              </button>
            </div>
          </motion.div>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary-400" />
                  Generated {result.type.replace('_', ' ')}
                </h3>
                <button
                  onClick={() => handleCopy(result.content)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-700/30 hover:bg-surface-700/50 text-surface-300 text-xs font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              {result.subject && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-surface-900/50 border border-surface-700/30">
                  <p className="text-xs text-surface-500 mb-1">Subject</p>
                  <p className="text-sm text-surface-200 font-medium">{result.subject}</p>
                </div>
              )}
              <div className="px-3 py-3 rounded-lg bg-surface-900/50 border border-surface-700/30">
                <p className="text-sm text-surface-300 whitespace-pre-wrap leading-relaxed">{result.content}</p>
              </div>
              <div className="flex items-center gap-3 mt-3 text-xs text-surface-500">
                <span>To: {result.leadInfo.companyName}</span>
                <span>Tone: {result.tone}</span>
              </div>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5"
          >
            <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">History</h3>
            {!history || history.length === 0 ? (
              <div className="text-center py-8">
                <Send className="w-6 h-6 text-surface-600 mx-auto mb-2" />
                <p className="text-xs text-surface-500">No outreach generated yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((item, i) => (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-3 rounded-lg bg-surface-900/30 border border-surface-700/30 hover:border-surface-600/30 transition-colors cursor-pointer"
                    onClick={() => setResult(item)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-surface-400 capitalize">{item.type.replace('_', ' ')}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(item._id); }}
                        className="p-1 rounded text-surface-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-surface-200 font-medium truncate">{item.leadInfo.companyName}</p>
                    <p className="text-[10px] text-surface-500 mt-1">{formatDate(item.generatedAt)}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
