import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User, Mail, Shield, Key, Moon, Sun, CreditCard,
  Copy, Check, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

function SettingSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-surface-700/50 bg-surface-800/50 backdrop-blur-sm p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary-400" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const [name, setName] = useState(user?.name || '');
  const [copied, setCopied] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) => authApi.updateProfile(data),
    onSuccess: (data) => {
      setUser(data);
      toast.success('Profile updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Update failed'),
  });

  const copyApiKey = () => {
    const demoKey = 'gfm_sk_' + 'x'.repeat(40);
    navigator.clipboard.writeText(demoKey).then(() => {
      setCopied(true);
      toast.success('API key copied');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const planDetails = {
    free: { label: 'Free', color: 'text-surface-400', border: 'border-surface-600', credits: 100 },
    pro: { label: 'Pro', color: 'text-primary-400', border: 'border-primary-500/50', credits: 1000 },
    enterprise: { label: 'Enterprise', color: 'text-amber-400', border: 'border-amber-500/50', credits: 10000 },
  };

  const plan = planDetails[user?.plan || 'free'];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-surface-400">Manage your account and preferences</p>
      </motion.div>

      <SettingSection title="Profile" icon={User}>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-900/30 border border-surface-700/30">
            <div className="w-14 h-14 rounded-full bg-primary-600/20 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-400">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-surface-400">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-surface-400">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-900/50 border border-surface-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-surface-400">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-surface-900/30 border border-surface-700 rounded-lg px-3 py-2.5 text-sm text-surface-500 cursor-not-allowed"
            />
          </div>
          <button
            onClick={() => updateMutation.mutate({ name })}
            disabled={updateMutation.isPending || name === user?.name}
            className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </SettingSection>

      <SettingSection title="Plan & Billing" icon={CreditCard}>
        <div className={`p-4 rounded-lg border ${plan.border} bg-surface-900/30`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-lg font-bold ${plan.color}`}>{plan.label} Plan</span>
            <span className="text-xs text-surface-500">{plan.credits} credits/mo</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-surface-400">
            <Shield className="w-4 h-4" />
            {plan.label === 'Free' ? 'Basic features included' : 'All features unlocked'}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-400">Credits Used</span>
            <span className="text-white font-medium">{100 - (user?.credits || 0)} / {plan.credits}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-surface-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all"
              style={{ width: `${((plan.credits - (user?.credits || 0)) / plan.credits) * 100}%` }}
            />
          </div>
        </div>
      </SettingSection>

      <SettingSection title="API Key" icon={Key}>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-900/50 border border-surface-700/30">
          <code className="flex-1 text-xs text-surface-400 font-mono">
            gfm_sk_{'•'.repeat(40)}
          </code>
          <button
            onClick={copyApiKey}
            className="p-2 rounded-lg text-surface-500 hover:text-primary-400 hover:bg-surface-700/50 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-surface-500 mt-2">Use this key to access the GTM API programmatically.</p>
      </SettingSection>

      <SettingSection title="Appearance" icon={isDark ? Moon : Sun}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-surface-200">Dark Mode</p>
            <p className="text-xs text-surface-500">Toggle dark mode across the app</p>
          </div>
          <button
            onClick={toggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${isDark ? 'bg-primary-600' : 'bg-surface-600'}`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-0.5'
              } flex items-center justify-center`}
            >
              {isDark ? <Moon className="w-3 h-3 text-surface-800" /> : <Sun className="w-3 h-3 text-amber-500" />}
            </div>
          </button>
        </div>
      </SettingSection>
    </div>
  );
}
