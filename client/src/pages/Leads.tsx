import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search, Plus, Upload, Download, Sparkles, Users, Filter, Globe,
  Building2, Trash2, MoreHorizontal, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { leadsApi } from '../services/api';
import { cn, formatDate, truncate } from '../lib/utils';
import type { Lead } from '../types';

export default function Leads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ domain: '', companyName: '', industry: '', location: '' });
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['leads', search, sortKey, sortDir],
    queryFn: () => leadsApi.list({ search, sort: sortKey, order: sortDir }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Lead>) => leadsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead created');
      setShowAddModal(false);
      setNewLead({ domain: '', companyName: '', industry: '', location: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create lead'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deleted');
    },
    onError: (err: any) => toast.error('Failed to delete lead'),
  });

  const enrichMutation = useMutation({
    mutationFn: (id: string) => leadsApi.enrich(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead enrichment started');
    },
    onError: (err: any) => toast.error('Failed to enrich lead'),
  });

  const batchEnrichMutation = useMutation({
    mutationFn: (ids: string[]) => leadsApi.batchEnrich(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Batch enrichment queued');
      setSelectedLeads([]);
    },
    onError: (err: any) => toast.error('Failed to start batch enrichment'),
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const columns = [
    {
      key: 'domain', header: 'Domain', sortable: true,
      render: (l: Lead) => (
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-surface-500 flex-shrink-0" />
          <span className="text-sm font-medium text-white">{l.domain || '—'}</span>
        </div>
      ),
    },
    {
      key: 'companyName', header: 'Company', sortable: true,
      render: (l: Lead) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-surface-500 flex-shrink-0" />
          <span className="text-sm text-surface-200">{l.companyName || '—'}</span>
        </div>
      ),
    },
    {
      key: 'industry', header: 'Industry', sortable: true,
      render: (l: Lead) => <span className="text-sm text-surface-300">{l.industry || '—'}</span>,
    },
    {
      key: 'status', header: 'Status',
      render: (l: Lead) => <StatusBadge status={l.status} />,
    },
    {
      key: 'createdAt', header: 'Created', sortable: true,
      render: (l: Lead) => <span className="text-xs text-surface-500">{formatDate(l.createdAt)}</span>,
    },
    {
      key: 'actions', header: '',
      className: 'w-20',
      render: (l: Lead) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); enrichMutation.mutate(l._id); }}
            disabled={l.status === 'enriched'}
            className="p-1.5 rounded-lg text-surface-500 hover:text-primary-400 hover:bg-surface-700/50 disabled:opacity-30 transition-colors"
            title="Enrich"
          >
            <Sparkles className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(l._id); }}
            className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-surface-700/50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
          <h2 className="text-xl font-bold text-white">Leads</h2>
          <p className="text-sm text-surface-400">Manage and enrich your lead database</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedLeads.length > 0 && (
            <button
              onClick={() => batchEnrichMutation.mutate(selectedLeads)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 text-sm font-medium hover:bg-violet-600/20 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Enrich ({selectedLeads.length})
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors shadow-lg shadow-primary-500/20"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by domain, company, industry..."
            className="w-full bg-surface-800/50 border border-surface-700/50 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500/30 transition-all"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm overflow-hidden"
      >
        {error ? (
          <div className="p-12 text-center">
            <p className="text-red-400 text-sm">Failed to load leads. Please try again.</p>
          </div>
        ) : !leads || leads.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No leads yet"
            description="Add your first lead to start building your GTM pipeline."
            action={{ label: 'Add Lead', onClick: () => setShowAddModal(true) }}
          />
        ) : (
          <DataTable
            columns={columns}
            data={leads}
            loading={isLoading}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            onRowClick={(l) => navigate(`/leads/${l._id}`)}
          />
        )}
      </motion.div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Lead" size="sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(newLead);
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-surface-400">Domain</label>
            <input
              type="text"
              value={newLead.domain}
              onChange={(e) => setNewLead({ ...newLead, domain: e.target.value })}
              className="w-full bg-surface-900/50 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              placeholder="company.com"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-surface-400">Company Name</label>
            <input
              type="text"
              value={newLead.companyName}
              onChange={(e) => setNewLead({ ...newLead, companyName: e.target.value })}
              className="w-full bg-surface-900/50 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              placeholder="Acme Inc."
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-surface-400">Industry</label>
            <input
              type="text"
              value={newLead.industry}
              onChange={(e) => setNewLead({ ...newLead, industry: e.target.value })}
              className="w-full bg-surface-900/50 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              placeholder="SaaS, Fintech..."
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-surface-400">Location</label>
            <input
              type="text"
              value={newLead.location}
              onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
              className="w-full bg-surface-900/50 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
              placeholder="San Francisco, CA"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-surface-700 text-surface-300 text-sm font-medium hover:bg-surface-700/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
