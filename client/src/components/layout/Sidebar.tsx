import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, GitBranch, Briefcase, Send,
  FileText, Settings, X, ChevronLeft, Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/workflows', icon: GitBranch, label: 'Workflows' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/outreach', icon: Send, label: 'Outreach' },
  { to: '/resume', icon: FileText, label: 'Resume Optimizer' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={onClose} />
      )}
      <AnimatePresence mode="wait">
        {(open || true) && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className={cn(
              'fixed lg:sticky top-0 left-0 z-30 h-screen w-64 flex-shrink-0',
              'bg-surface-900/80 backdrop-blur-xl border-r border-surface-700/30',
              'lg:translate-x-0 transition-transform duration-300',
              open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            )}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between px-5 h-16 border-b border-surface-700/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white tracking-tight">GTM</span>
                    <span className="text-[10px] block text-primary-400 font-medium leading-none">Automation</span>
                  </div>
                </div>
                <button onClick={onClose} className="lg:hidden p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) => cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary-600/10 text-primary-400 border border-primary-500/20'
                        : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50 border border-transparent'
                    )}
                  >
                    <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>

              <div className="p-4 border-t border-surface-700/30">
                <div className="flex items-center gap-3 px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary-400">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-200 truncate">{user?.name || 'User'}</p>
                    <p className="text-[11px] text-surface-500 capitalize">{user?.plan || 'Free'} Plan</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="mt-2 w-full px-3 py-2 rounded-lg text-xs text-surface-500 hover:text-surface-300 hover:bg-surface-800/50 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
