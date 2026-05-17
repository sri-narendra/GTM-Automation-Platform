import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Globe, Building2, MapPin, Hash, Sparkles,
  Target, Lightbulb, Users, Code, ExternalLink, Send,
  RefreshCw, DollarSign, Award, Newspaper
} from 'lucide-react';
import toast from 'react-hot-toast';
import { leadsApi } from '../services/api';
import { formatDate } from '../lib/utils';
import StatusBadge from '../components/ui/StatusBadge';

function DetailCard({ title, icon: Icon, children, className = '' }: { title: string; icon: any; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5 ${className}`}
    >
      <h3 className="text-xs font-semibold text-surface-400 uppercase tracking-wider flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary-400" />
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lead, isLoading, error } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsApi.get(id!),
    enabled: !!id,
  });

  const enrichMutation = useMutation({
    mutationFn: () => leadsApi.enrich(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      toast.success('Enrichment started');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to enrich'),
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-surface-700/50 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-surface-700/30 rounded-xl animate-pulse" />
          <div className="h-64 bg-surface-700/30 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <p className="text-surface-400">Lead not found</p>
        <button onClick={() => navigate('/leads')} className="mt-4 text-primary-400 hover:text-primary-300 text-sm">
          Back to leads
        </button>
      </div>
    );
  }

  const enriched = lead.enrichedData;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => navigate('/leads')}
          className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">{lead.companyName || lead.domain || 'Lead Detail'}</h2>
            <StatusBadge status={lead.status} />
          </div>
          <p className="text-sm text-surface-400">Added {formatDate(lead.createdAt)}</p>
        </div>
        <button
          onClick={() => enrichMutation.mutate()}
          disabled={enrichMutation.isPending || lead.status === 'enriched'}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium disabled:opacity-50 transition-colors shadow-lg shadow-primary-500/20"
        >
          {enrichMutation.isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {enrichMutation.isPending ? 'Enriching...' : lead.status === 'enriched' ? 'Enriched' : 'Enrich'}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DetailCard title="Company Info" icon={Building2}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Domain', value: lead.domain, icon: Globe },
                { label: 'Industry', value: lead.industry, icon: Hash },
                { label: 'Location', value: lead.location, icon: MapPin },
                { label: 'Company Size', value: lead.size, icon: Users },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <Icon className="w-4 h-4 text-surface-500 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-surface-500 font-medium uppercase">{label}</p>
                    <p className="text-sm text-surface-200 mt-0.5">{value || '—'}</p>
                  </div>
                </div>
              ))}
            </div>
            {lead.companyDescription && (
              <div className="mt-4 pt-4 border-t border-surface-700/30">
                <p className="text-xs text-surface-500 font-medium mb-1">Description</p>
                <p className="text-sm text-surface-300 leading-relaxed">{lead.companyDescription}</p>
              </div>
            )}
          </DetailCard>

          <DetailCard title="AI Summary" icon={Lightbulb}>
            {enriched?.summary ? (
              <p className="text-sm text-surface-300 leading-relaxed">{enriched.summary}</p>
            ) : (
              <div className="text-center py-6">
                <Lightbulb className="w-8 h-8 text-surface-600 mx-auto mb-2" />
                <p className="text-sm text-surface-500">Enrich this lead to generate an AI summary</p>
              </div>
            )}
          </DetailCard>

          {enriched?.recentNews && enriched.recentNews.length > 0 && (
            <DetailCard title="Recent News" icon={Newspaper}>
              <div className="space-y-2">
                {enriched.recentNews.map((news, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-surface-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                    {news}
                  </div>
                ))}
              </div>
            </DetailCard>
          )}

          {enriched?.painPoints && enriched.painPoints.length > 0 && (
            <DetailCard title="Pain Points" icon={Target} className="border-amber-500/20">
              <div className="space-y-2">
                {enriched.painPoints.map((p, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-surface-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    {p}
                  </div>
                ))}
              </div>
            </DetailCard>
          )}
        </div>

        <div className="space-y-6">
          <DetailCard title="Technologies" icon={Code}>
            {enriched?.technologies && enriched.technologies.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {enriched.technologies.map((tech, i) => (
                  <span key={i} className="px-2 py-1 rounded-md bg-primary-500/10 border border-primary-500/20 text-xs text-primary-400 font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-500">No technologies detected</p>
            )}
          </DetailCard>

          <DetailCard title="Target Audience" icon={Users}>
            {enriched?.audience && enriched.audience.length > 0 ? (
              <div className="space-y-1.5">
                {enriched.audience.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-surface-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                    {a}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-500">No audience data</p>
            )}
          </DetailCard>

          {enriched?.funding && (
            <DetailCard title="Funding" icon={DollarSign}>
              <p className="text-sm text-surface-200">{enriched.funding}</p>
            </DetailCard>
          )}

          {enriched?.competitors && enriched.competitors.length > 0 && (
            <DetailCard title="Competitors" icon={Award}>
              <div className="space-y-1.5">
                {enriched.competitors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-surface-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {c}
                  </div>
                ))}
              </div>
            </DetailCard>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-5"
          >
            <button
              onClick={() => navigate('/outreach', { state: { leadId: lead._id } })}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-primary-600 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Send className="w-4 h-4" />
              Generate Outreach
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
