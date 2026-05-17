import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, GitBranch, Briefcase, FileText, Send, Plus, Play,
  Sparkles, TrendingUp, Activity, Zap
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import StatCard from '../components/ui/StatCard';
import StatusBadge from '../components/ui/StatusBadge';
import { statsApi } from '../services/api';
import { formatRelativeTime } from '../lib/utils';
import { useAuthStore } from '../store/authStore';

const chartData = [
  { name: 'Mon', leads: 12, workflows: 3, outreach: 8 },
  { name: 'Tue', leads: 19, workflows: 5, outreach: 12 },
  { name: 'Wed', leads: 15, workflows: 7, outreach: 9 },
  { name: 'Thu', leads: 22, workflows: 4, outreach: 15 },
  { name: 'Fri', leads: 18, workflows: 6, outreach: 11 },
  { name: 'Sat', leads: 10, workflows: 2, outreach: 5 },
  { name: 'Sun', leads: 14, workflows: 4, outreach: 7 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-surface-800 border border-surface-700/50 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-xs text-surface-400 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-xs font-medium" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => statsApi.getDashboard().catch(() => null),
    refetchInterval: 30000,
  });

  const quickActions = [
    { label: 'New Lead', icon: Users, onClick: () => navigate('/leads'), color: 'bg-violet-500/10 text-violet-400' },
    { label: 'New Workflow', icon: GitBranch, onClick: () => navigate('/workflows/new'), color: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Optimize Resume', icon: FileText, onClick: () => navigate('/resume'), color: 'bg-amber-500/10 text-amber-400' },
    { label: 'Generate Outreach', icon: Send, onClick: () => navigate('/outreach'), color: 'bg-sky-500/10 text-sky-400' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white">
            Welcome back, {user?.name || 'User'}
          </h2>
          <p className="text-surface-400 text-sm mt-1">Here's what's happening with your GTM campaigns</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-medium">
          <Zap className="w-3.5 h-3.5" />
          {user?.credits || 0} credits remaining
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads ?? 0}
          icon={Users}
          color="indigo"
          index={0}
          onClick={() => navigate('/leads')}
        />
        <StatCard
          title="Workflows"
          value={stats?.totalWorkflows ?? 0}
          icon={GitBranch}
          color="emerald"
          index={1}
          onClick={() => navigate('/workflows')}
        />
        <StatCard
          title="Jobs"
          value={stats?.totalJobs ?? 0}
          icon={Briefcase}
          color="violet"
          index={2}
          trend={{ value: 12, positive: true }}
          onClick={() => navigate('/jobs')}
        />
        <StatCard
          title="Resumes"
          value={stats?.totalResumes ?? 0}
          icon={FileText}
          color="amber"
          index={3}
          onClick={() => navigate('/resume')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary-400" />
              Activity Overview
            </h3>
            <span className="text-[11px] text-surface-500">Last 7 days</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeWidth={0.5} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
                <Line type="monotone" dataKey="workflows" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                <Line type="monotone" dataKey="outreach" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-6"
        >
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-400" />
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                whileHover={{ x: 4 }}
                onClick={action.onClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-surface-700/30 hover:bg-surface-700/50 border border-surface-700/30 transition-all text-left"
              >
                <div className={`p-1.5 rounded-lg ${action.color}`}>
                  <action.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-surface-200">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/30">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-400" />
            Recent Jobs
          </h3>
          <button onClick={() => navigate('/jobs')} className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium">
            View all
          </button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-surface-700/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats?.recentJobs?.length ? (
            <div className="space-y-2">
              {stats.recentJobs.slice(0, 5).map((job, i) => (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-surface-700/20 border border-surface-700/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-surface-700/50">
                      <Briefcase className="w-3.5 h-3.5 text-surface-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-200 capitalize">{job.type.replace('_', ' ')}</p>
                      <p className="text-[11px] text-surface-500">{formatRelativeTime(job.createdAt)}</p>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-8 h-8 text-surface-600 mx-auto mb-2" />
              <p className="text-sm text-surface-400">No recent jobs</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
